// src/pages/QuotationEdit.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { quotationService, Quotation } from "@/services/quotation.service";
import {
  quotationStatusService,
  QUOTATION_STATUSES,
  QuotationStatusHistory,
} from "@/services/quotation-status.service";
import { productService, Product } from "@/services/product.service";
import { roomService, Room } from "@/services/room.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Phone,
  Mail,
  Package,
  IndianRupee,
  FileText,
  Building2,
  Layers,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  MapPin,
  CreditCard,
  Plus,
  Minus,
  Edit,
  Trash2,
  Check,
  Calculator,
  Home,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── dnd-kit imports ──────────────────────────────────────────────────────
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Status Colors ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Pending:
    "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  "Approved by Admin":
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  "Sent to Customer":
    "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  "Approved by Customer":
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  "Invoice Generated":
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  "Work Started":
    "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  "On Going":
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  "Work Completed":
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  Closed:
    "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
  Rejected:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const roundToTwo = (n: number) => Math.round(n * 100) / 100;
const formatNumberForDisplay = (value: number | undefined | null): string =>
  value === undefined || value === null || value === 0 ? "" : String(value);
const parseNumberFromInput = (value: string): number =>
  value === "" || value === null || value === undefined ? 0 : parseFloat(value) || 0;

// ─── Sortable Room Item ──────────────────────────────────────────────────
interface SortableRoomItemProps {
  room: any;
  isExpanded: boolean;
  toggleRoom: (id: string) => void;
  openAddProductDialog: (roomId: string) => void;
  handleEditItem: (room: any, item: any) => void;
  onDeleteRoom: (qrId: string, roomName: string) => void;
  onDeleteItem: (qpId: string, productName: string) => void;
  formatCurrency: (amount: number) => string;
  getQtyTypeLabel: (type: string) => string;
}

function SortableRoomItem({
  room,
  isExpanded,
  toggleRoom,
  openAddProductDialog,
  handleEditItem,
  onDeleteRoom,
  onDeleteItem,
  formatCurrency,
  getQtyTypeLabel,
}: SortableRoomItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: room.qr_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const roomTotal = parseFloat(room.room_total) || 0;
  const items = room.items || [];

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Room Header – draggable handle is the grip icon */}
        <div
          className={cn(
            "flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors",
            isExpanded && "bg-secondary/50"
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Drag Handle */}
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors p-1 -ml-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 md:w-5 md:h-5" />
            </div>

            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <div
              className="min-w-0 flex-1 cursor-pointer"
              onClick={() => toggleRoom(room.qr_id)}
            >
              <h4 className="font-semibold text-foreground truncate">
                {room.room_name || `Room ${room.sort_order + 1}`}
              </h4>
              <p className="text-xs text-muted-foreground">{items.length} items</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRoom(room.qr_id, room.room_name || `Room ${room.sort_order + 1}`);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-foreground whitespace-nowrap">
              {formatCurrency(roomTotal)}
            </span>
            <ChevronUp
              className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "" : "rotate-180"}`}
              onClick={() => toggleRoom(room.qr_id)}
            />
          </div>
        </div>

        {/* Room Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Products</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 rounded-lg text-xs"
                onClick={() => openAddProductDialog(room.qr_id)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">No items in this room</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1"
                  onClick={() => openAddProductDialog(room.qr_id)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: any, idx: number) => {
                  const calculatedQty = parseFloat(item.calculated_qty) || 0;
                  const unitPrice = parseFloat(item.unit_price) || 0;
                  const totalPrice = parseFloat(item.total_price) || 0;
                  const qtyType = item.qty_type || "Fixed";
                  const isFixedItem = qtyType === "Fixed";

                  return (
                    <div
                      key={item.qp_id || idx}
                      className="rounded-lg border border-border/50 p-4 bg-card hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-foreground truncate">
                            {item.product_name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {getQtyTypeLabel(qtyType)}
                            </Badge>
                            {item.is_special === "1" && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200"
                              >
                                Special
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="text-right mr-2">
                            <p className="font-bold text-primary">
                              {formatCurrency(totalPrice)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Unit: {formatCurrency(unitPrice)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => handleEditItem(room, item)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              onDeleteItem(item.qp_id, item.product_name)
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-muted/20 rounded-lg p-3 mb-3">
                        {isFixedItem ? (
                          <>
                            <div>
                              <span className="text-muted-foreground">Qty</span>
                              <p className="font-medium">{item.qty || 0}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Per</span>
                              <p className="font-medium">NOS</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Measure</span>
                              <p className="font-medium">{calculatedQty.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rate</span>
                              <p className="font-medium">{formatCurrency(unitPrice)}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-muted-foreground">Dimensions</span>
                              <p className="font-medium text-xs">
                                {(() => {
                                  switch (qtyType) {
                                    case "ByHW":
                                      return `${item.height || 0} × ${item.width || 0}`;
                                    case "ByHWD":
                                      return `${item.height || 0} × ${item.width || 0} × ${item.depth || 0}`;
                                    case "ByHWL":
                                      return `${item.height || 0} × ${item.width || 0} × ${item.length || 0}`;
                                    default:
                                      return `${item.height || 0} × ${item.width || 0}`;
                                  }
                                })()}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Per</span>
                              <p className="font-medium">SQFT</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Measure</span>
                              <p className="font-medium">{calculatedQty.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rate</span>
                              <p className="font-medium">{formatCurrency(unitPrice)}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {item.raw_materials && item.raw_materials.length > 0 && (
                        <div className="bg-secondary/10 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Raw Materials
                            </p>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {item.raw_materials.length}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.raw_materials.map((rm: any, rIdx: number) => (
                              <Badge
                                key={rIdx}
                                variant="secondary"
                                className="text-xs px-2 py-1 rounded-md"
                              >
                                {rm.rm_name || rm.name || "Material"}
                                {rm.required_qty &&
                                  ` (${parseFloat(rm.required_qty).toFixed(2)} ${rm.unit || ""})`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.remark && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">Remark:</span> {item.remark}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────
export default function QuotationEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [statusHistory, setStatusHistory] = useState<QuotationStatusHistory[]>([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusRemark, setStatusRemark] = useState("");
  const [updating, setUpdating] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  // Room order state (for drag‑and‑drop)
  const [roomOrder, setRoomOrder] = useState<any[]>([]);

  // Product edit state
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Add Room Dialog
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomToAdd, setSelectedRoomToAdd] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Add Product Dialog
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [selectedRoomForProduct, setSelectedRoomForProduct] = useState<string>("");
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>("");
  const [productQuantity, setProductQuantity] = useState(1);

  // Discount & GST Edit
  const [discountEditOpen, setDiscountEditOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"Percent" | "INR">("INR");
  const [discountValue, setDiscountValue] = useState(0);
  const [gstPercent, setGstPercent] = useState(0);
  const [isGstApplicable, setIsGstApplicable] = useState(true);

  // Confirm dialogs
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ qpId: string; productName: string } | null>(null);
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<{ qrId: string; roomName: string } | null>(null);

  // ─── DND Sensors ────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  const getEmployeeId = (): string => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) return JSON.parse(raw)?.emp_id || "";
    } catch {
      return "";
    }
  };

  // ─── Data Fetching ────────────────────────────────────────────────────
  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [quotationRes, historyRes] = await Promise.all([
        quotationService.getQuotation(id),
        quotationStatusService.getStatusHistory(id),
      ]);

      if (quotationRes.status === "success" && quotationRes.data) {
        setQuotation(quotationRes.data);
        setSelectedStatus(quotationRes.data.status || "Pending");
        setDiscountType((quotationRes.data.discount_type as "Percent" | "INR") || "INR");
        setDiscountValue(quotationRes.data.discount_value || 0);
        setGstPercent(quotationRes.data.gst_percent || 0);
        setIsGstApplicable(quotationRes.data.gst_applicable !== false);

        // Set room order from the fetched data (already sorted by sort_order)
        const rooms = quotationRes.data.rooms || [];
        setRoomOrder(rooms);
        if (rooms.length > 0) {
          setExpandedRooms(new Set([rooms[0].qr_id]));
        }
      } else {
        toast({
          title: "Error",
          description: quotationRes.message || "Failed to fetch quotation",
          variant: "destructive",
        });
        navigate("/quotations");
        return;
      }

      if (historyRes.status === "success" && historyRes.data) {
        setStatusHistory(historyRes.data);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      navigate("/quotations");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await productService.getProducts(companyId);
      if (res.status === "success" && res.data) {
        setProducts(res.data);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await roomService.getRooms(companyId);
      if (res.status === "success" && res.data) {
        const existingRoomIds = roomOrder.map((r: any) => r.room_id);
        const available = res.data.filter((r: any) => !existingRoomIds.includes(r.room_id));
        setAvailableRooms(available);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, [id]);

  // ─── Status Update ──────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!selectedStatus || !quotation?.quotation_id) return;

    setUpdating(true);
    try {
      const res = await quotationStatusService.updateStatus({
        quotation_id: quotation.quotation_id,
        company_id: getCompanyId(),
        emp_id: getEmployeeId(),
        status: selectedStatus,
        remark: statusRemark,
      });

      if (res.status === "success") {
        toast({ title: "Success", description: "Status updated successfully" });
        setStatusDialogOpen(false);
        setStatusRemark("");
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // ─── Room Toggle ────────────────────────────────────────────────────
  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  // ─── Helpers ────────────────────────────────────────────────────────
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount || 0).toLocaleString()}`;
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

  const calculateTotalMeasure = (item: any): number => {
    const qty = item.qty || 1;
    if (item.qty_type === "Fixed") return qty;

    const toFt = (v: number) =>
      (item.dimension_unit || "feet") === "feet" ? v : v / 12;
    const h = toFt(item.height || 0);
    const w = toFt(item.width || 0);
    const d = toFt(item.depth || 0);
    const l = toFt(item.length || 0);

    let measure = 0;
    if (item.qty_type === "ByHW") {
      measure = w * h * qty;
    } else if (item.qty_type === "ByHWD") {
      measure = w * h * d * qty;
    } else if (item.qty_type === "ByHWL") {
      measure = w * h * l * qty;
    } else {
      measure = qty;
    }
    return roundToTwo(measure);
  };

  const calculateItemTotal = (item: any): number => {
    const totalMeasure = calculateTotalMeasure(item);
    const unitPrice = item.unit_price || 0;
    return roundToTwo(totalMeasure * unitPrice);
  };

  // ─── Edit Item ─────────────────────────────────────────────────────
  const handleEditItem = (room: any, item: any) => {
    setEditingItem({
      ...item,
      roomId: room.qr_id,
      roomName: room.room_name,
      qp_id: item.qp_id,
      totalMeasure: calculateTotalMeasure(item),
    });
    setEditDialogOpen(true);
  };

  const handleSaveItemEdit = async () => {
    if (!editingItem || !quotation) return;

    setSaving(true);
    try {
      const totalPrice = calculateItemTotal(editingItem);

      if (!editingItem.qp_id) {
        toast({
          title: "Error",
          description: "Product ID is missing",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const payload = {
        type: 9,
        quotation_id: quotation.quotation_id,
        qp_id: editingItem.qp_id,
        product_id: editingItem.product_id,
        qty_type: editingItem.qty_type,
        qty: editingItem.qty || 1,
        height: editingItem.height || 0,
        width: editingItem.width || 0,
        depth: editingItem.depth || 0,
        length: editingItem.length || 0,
        dimension_unit: editingItem.dimension_unit || "feet",
        unit_price: editingItem.unit_price || 0,
        total_price: totalPrice,
        remark: editingItem.remark || "",
        company_id: getCompanyId(),
      };

      const res = await quotationService.updateQuotationProduct(payload);

      if (res.status === "success") {
        toast({ title: "Success", description: "Item updated successfully" });
        setEditDialogOpen(false);
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to update item",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Item ──────────────────────────────────────────────────
  const handleDeleteItem = async () => {
    if (!confirmDeleteItem || !quotation) return;

    setSaving(true);
    try {
      const payload = {
        type: 10,
        quotation_id: quotation.quotation_id,
        qp_id: confirmDeleteItem.qpId,
        company_id: getCompanyId(),
      };

      const res = await quotationService.deleteQuotationProduct(payload);

      if (res.status === "success") {
        toast({ title: "Success", description: "Item removed successfully" });
        setConfirmDeleteItem(null);
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to remove item",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Add Product ──────────────────────────────────────────────────
  const openAddProductDialog = (roomId: string) => {
    setSelectedRoomForProduct(roomId);
    setSelectedProductToAdd("");
    setProductQuantity(1);
    setAddProductDialogOpen(true);
  };

  const handleAddProduct = async () => {
    if (!quotation || !selectedRoomForProduct || !selectedProductToAdd) return;

    const product = products.find((p) => p.product_id === selectedProductToAdd);
    if (!product) {
      toast({ title: "Error", description: "Product not found", variant: "destructive" });
      return;
    }

    const room = roomOrder.find((r: any) => r.qr_id === selectedRoomForProduct);
    const existingProduct = room?.items?.find((i: any) => i.product_id === selectedProductToAdd);
    if (existingProduct) {
      toast({
        title: "Error",
        description: "This product is already added to this room",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: 8,
        quotation_id: quotation.quotation_id,
        qr_id: selectedRoomForProduct,
        room_id: room?.room_id || "",
        product_id: product.product_id,
        qty_type: product.qty_type || "Fixed",
        qty: productQuantity || 1,
        height: product.height || 0,
        width: product.width || 0,
        depth: product.depth || 0,
        length: product.length || 0,
        dimension_unit: "inches",
        unit_price: product.price || 0,
        total_price: calculateItemTotal({
          product_id: product.product_id,
          qty_type: product.qty_type || "Fixed",
          qty: productQuantity || 1,
          height: product.height || 0,
          width: product.width || 0,
          depth: product.depth || 0,
          length: product.length || 0,
          dimension_unit: "inches",
          unit_price: product.price || 0,
        }),
        remark: "",
        company_id: getCompanyId(),
      };

      const res = await quotationService.addQuotationProduct(payload);

      if (res.status === "success") {
        toast({ title: "Success", description: "Product added successfully" });
        setAddProductDialogOpen(false);
        setSelectedProductToAdd("");
        setProductQuantity(1);
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add product",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Add Room ──────────────────────────────────────────────────────
  const handleAddRoom = async () => {
    if (!quotation || !selectedRoomToAdd) return;

    setSaving(true);
    try {
      const payload = {
        type: 11,
        quotation_id: quotation.quotation_id,
        room_id: selectedRoomToAdd,
        company_id: getCompanyId(),
      };

      const res = await quotationService.addQuotationRoom(payload);

      if (res.status === "success") {
        toast({ title: "Success", description: "Room added successfully" });
        setAddRoomDialogOpen(false);
        setSelectedRoomToAdd("");
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add room",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Room ──────────────────────────────────────────────────
  const handleDeleteRoom = async () => {
    if (!confirmDeleteRoom || !quotation) return;

    setSaving(true);
    try {
      const payload = {
        type: 12,
        quotation_id: quotation.quotation_id,
        qr_id: confirmDeleteRoom.qrId,
        company_id: getCompanyId(),
      };

      const res = await quotationService.deleteQuotationRoom(payload);

      if (res.status === "success") {
        toast({ title: "Success", description: "Room removed successfully" });
        setConfirmDeleteRoom(null);
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to remove room",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Discount & GST ──────────────────────────────────────────────
  const handleUpdateDiscountGst = async () => {
    if (!quotation) return;

    setSaving(true);
    try {
      const subtotal = quotation.subtotal || 0;
      const discountAmount = discountType === "Percent"
        ? (subtotal * discountValue) / 100
        : discountValue;

      const amountAfterDiscount = Math.max(0, subtotal - discountAmount);
      const gstAmount = isGstApplicable ? (amountAfterDiscount * gstPercent) / 100 : 0;
      const finalAmount = amountAfterDiscount + gstAmount;

      const payload = {
        type: 13,
        quotation_id: quotation.quotation_id,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        amount_after_discount: amountAfterDiscount,
        gst_applicable: isGstApplicable ? 1 : 0,
        gst_percent: gstPercent,
        gst_amount: gstAmount,
        final_amount: finalAmount,
        company_id: getCompanyId(),
      };

      const res = await quotationService.updateQuotationDiscountGst(payload);

      if (res.status === "success") {
        toast({ title: "Success", description: "Discount and GST updated successfully" });
        setDiscountEditOpen(false);
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to update discount and GST",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Drag End Handler ──────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find indices in the current roomOrder
    const oldIndex = roomOrder.findIndex((room) => room.qr_id === active.id);
    const newIndex = roomOrder.findIndex((room) => room.qr_id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder locally
    const newOrder = arrayMove(roomOrder, oldIndex, newIndex);
    setRoomOrder(newOrder);

    // Prepare payload for API: assign sort_order based on new index
    const roomOrderPayload = newOrder.map((room, index) => ({
      qr_id: room.qr_id,
      sort_order: index,
    }));

    // Update database
    try {
      await quotationService.updateRoomSortOrder(quotation!.quotation_id, roomOrderPayload);
      toast({ title: "Success", description: "Room order updated" });
      // Optionally refresh data to get updated sort_order from server
      // await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room order",
        variant: "destructive",
      });
      // Revert to previous order on error
      setRoomOrder(roomOrder);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────
  const clientData = quotation
    ? {
      name: quotation.client_name || "—",
      phone:
        [
          quotation.phone,
          quotation.phone1,
          quotation.phone2,
          quotation.whatsapp_number,
        ]
          .filter(Boolean)
          .join(", ") || "—",
      email: quotation.email || quotation.client_email || "—",
      address: quotation.address || "—",
      city: quotation.city || quotation.client_city || "—",
      state: quotation.state || quotation.client_state || "—",
      gst: quotation.gst_number || quotation.client_gst || "—",
    }
    : null;

  if (loading) {
    return (
      <MainLayout title="Edit Quotation" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!quotation) {
    return (
      <MainLayout title="Edit Quotation" subtitle="Not found">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Quotation not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/quotations")}
          >
            Back to List
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Available products for a room (excluding already added)
  const getAvailableProducts = (roomId: string) => {
    const room = roomOrder.find((r: any) => r.qr_id === roomId);
    const addedProductIds = room?.items?.map((i: any) => i.product_id) || [];
    return products.filter((p) => !addedProductIds.includes(p.product_id));
  };

  const getDimensionFields = (qtyType: string) => {
    switch (qtyType) {
      case "ByHW":
        return { showHeight: true, showWidth: true, showDepth: false, showLength: false };
      case "ByHWD":
        return { showHeight: true, showWidth: true, showDepth: true, showLength: false };
      case "ByHWL":
        return { showHeight: true, showWidth: true, showDepth: false, showLength: true };
      default:
        return { showHeight: false, showWidth: false, showDepth: false, showLength: false };
    }
  };

  return (
    <MainLayout
      title={`Edit ${quotation.quotation_number}`}
      subtitle="Edit quotation details"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={() => navigate("/quotations")}
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-semibold text-foreground flex items-center gap-3 flex-wrap">
              {quotation.quotation_number}
              <Badge
                className={`${STATUS_COLORS[quotation.status || "Pending"] || STATUS_COLORS["Pending"]} border px-3 py-1`}
              >
                {quotation.status || "Pending"}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Created: {formatDate(quotation.c_date)} · By:{" "}
              {quotation.generated_by_name || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              onClick={() => {
                setDiscountEditOpen(true);
                setDiscountType((quotation.discount_type as "Percent" | "INR") || "INR");
                setDiscountValue(quotation.discount_value || 0);
                setGstPercent(quotation.gst_percent || 0);
                setIsGstApplicable(quotation.gst_applicable !== false);
              }}
            >
              <Calculator className="w-4 h-4" />
              Discount & GST
            </Button>
            <Button
              onClick={() => setStatusDialogOpen(true)}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Change Status
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border shadow-soft rounded-xl">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="text-lg font-semibold">
              {formatCurrency(quotation.subtotal || 0)}
            </p>
          </Card>
          <Card className="p-4 bg-card border-border shadow-soft rounded-xl">
            <p className="text-xs text-muted-foreground">Discount</p>
            <p className="text-lg font-semibold text-destructive">
              - {formatCurrency(quotation.discount_amount || 0)}
            </p>
          </Card>
          <Card className="p-4 bg-card border-border shadow-soft rounded-xl">
            <p className="text-xs text-muted-foreground">
              GST ({quotation.gst_percent || 0}%)
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(quotation.gst_amount || 0)}
            </p>
          </Card>
          <Card className="p-4 bg-primary/5 border-primary/20 rounded-xl">
            <p className="text-xs text-muted-foreground">Final Total</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(quotation.final_amount || 0)}
            </p>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Details - READ ONLY */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Client Details <Badge variant="secondary" className="text-[10px]">Read Only</Badge>
              </h3>
              <div className="space-y-3">
                <p className="font-semibold text-foreground text-lg">
                  {clientData?.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{clientData?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{clientData?.email}</span>
                  </div>
                </div>
                {clientData?.address && clientData?.address !== "—" && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1 border-t border-border/50">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span>{clientData?.address}</span>
                      {clientData?.city && clientData?.city !== "—" && (
                        <span>, {clientData?.city}</span>
                      )}
                      {clientData?.state && clientData?.state !== "—" && (
                        <span>, {clientData?.state}</span>
                      )}
                    </div>
                  </div>
                )}
                {clientData?.gst && clientData?.gst !== "—" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t border-border/50">
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>GST: {clientData?.gst}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Package Details - READ ONLY */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-gold" />
                Package Details <Badge variant="secondary" className="text-[10px]">Read Only</Badge>
              </h3>
              {quotation.package_name ? (
                <div>
                  <p className="font-semibold text-foreground">
                    {quotation.package_name}
                  </p>
                  {quotation.package_details && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {quotation.package_details}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No package selected (custom)
                </p>
              )}
            </Card>

            {/* Room-wise Breakdown with Drag & Drop */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Room-wise Breakdown
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 rounded-lg text-xs"
                  onClick={() => {
                    fetchAvailableRooms();
                    setAddRoomDialogOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Room
                </Button>
              </div>

              {roomOrder.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No rooms found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1"
                    onClick={() => {
                      fetchAvailableRooms();
                      setAddRoomDialogOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Room
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={roomOrder.map((room) => room.qr_id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {roomOrder.map((room) => (
                        <SortableRoomItem
                          key={room.qr_id}
                          room={room}
                          isExpanded={expandedRooms.has(room.qr_id)}
                          toggleRoom={toggleRoom}
                          openAddProductDialog={openAddProductDialog}
                          handleEditItem={handleEditItem}
                          onDeleteRoom={(qrId, roomName) =>
                            setConfirmDeleteRoom({ qrId, roomName })
                          }
                          onDeleteItem={(qpId, productName) =>
                            setConfirmDeleteItem({ qpId, productName })
                          }
                          formatCurrency={formatCurrency}
                          getQtyTypeLabel={getQtyTypeLabel}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Card>

            {/* Special Instructions - Editable */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Special Instructions
              </h3>
              <Textarea
                value={quotation.remark || ""}
                onChange={(e) => {
                  setQuotation({ ...quotation, remark: e.target.value });
                }}
                placeholder="Add special instructions..."
                rows={3}
                className="rounded-xl"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1"
                onClick={async () => {
                  if (!quotation) return;
                  setSaving(true);
                  try {
                    const res = await quotationService.updateQuotationRemark({
                      quotation_id: quotation.quotation_id,
                      remark: quotation.remark || "",
                      company_id: getCompanyId(),
                    });
                    if (res.status === "success") {
                      toast({ title: "Success", description: "Instructions updated" });
                    } else {
                      toast({ title: "Error", description: res.message, variant: "destructive" });
                    }
                  } catch (e: any) {
                    toast({ title: "Error", description: "Failed to update", variant: "destructive" });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Instructions
              </Button>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl sticky top-24">
              <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(quotation.subtotal || 0)}
                  </span>
                </div>
                {(quotation.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-destructive">
                      - {formatCurrency(quotation.discount_amount || 0)}
                    </span>
                  </div>
                )}
                {quotation.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After Discount</span>
                    <span className="font-medium">
                      {formatCurrency(quotation.amount_after_discount || 0)}
                    </span>
                  </div>
                )}
                {(quotation.gst_percent || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      GST ({quotation.gst_percent}%)
                    </span>
                    <span className="font-medium">
                      {formatCurrency(quotation.gst_amount || 0)}
                    </span>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(quotation.final_amount || 0)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Quotation ID</span>
                  <span className="font-mono">{quotation.quotation_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{formatDate(quotation.c_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created By</span>
                  <span>{quotation.generated_by_name || "—"}</span>
                </div>
              </div>
            </Card>

            {/* Status History */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Status History
              </h3>
              {statusHistory.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {statusHistory.map((history, index) => {
                    const Icon = STATUS_COLORS[history.status]
                      ? CheckCircle2
                      : Clock;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0"
                      >
                        <div
                          className={`mt-0.5 p-1 rounded-full ${STATUS_COLORS[history.status] || "bg-gray-100"}`}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {history.status}
                          </p>
                          {history.remark && (
                            <p className="text-xs text-muted-foreground">
                              {history.remark}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {history.emp_name || "—"} ·{" "}
                            {history.c_date ? formatDate(history.c_date) : "—"}
                            {history.c_time && ` ${history.c_time}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No status history
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* ─── Dialogs ────────────────────────────────────────────────────── */}
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Update the status for {quotation.quotation_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  {QUOTATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">Remark (optional)</Label>
              <Textarea
                id="remark"
                value={statusRemark}
                onChange={(e) => setStatusRemark(e.target.value)}
                placeholder="Add a note about this status change..."
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl h-11 flex-1 sm:flex-none"
              onClick={() => setStatusDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 flex-1 sm:flex-none gap-2"
              onClick={handleUpdateStatus}
              disabled={updating || !selectedStatus}
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Edit product details for {editingItem?.product_name}
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Qty Type</Label>
                  <Select
                    value={editingItem.qty_type || "Fixed"}
                    onValueChange={(v) => {
                      const updated = { ...editingItem, qty_type: v };
                      updated.totalMeasure = calculateTotalMeasure(updated);
                      setEditingItem(updated);
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed</SelectItem>
                      <SelectItem value="ByHW">H × W</SelectItem>
                      <SelectItem value="ByHWD">H × W × D</SelectItem>
                      <SelectItem value="ByHWL">H × W × L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Select
                    value={editingItem.dimension_unit || "feet"}
                    onValueChange={(v) => {
                      const updated = { ...editingItem, dimension_unit: v };
                      updated.totalMeasure = calculateTotalMeasure(updated);
                      setEditingItem(updated);
                    }}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feet">Feet</SelectItem>
                      <SelectItem value="inches">Inches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editingItem.qty_type !== "Fixed" && (
                <div className="grid grid-cols-2 gap-2">
                  {(() => {
                    const fields = getDimensionFields(editingItem.qty_type);
                    return (
                      <>
                        {fields.showHeight && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Height</Label>
                            <Input
                              type="number"
                              value={formatNumberForDisplay(editingItem.height)}
                              onChange={(e) => {
                                const val = parseNumberFromInput(e.target.value);
                                const updated = { ...editingItem, height: val };
                                updated.totalMeasure = calculateTotalMeasure(updated);
                                setEditingItem(updated);
                              }}
                              className="h-9 rounded-lg text-sm"
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                        )}
                        {fields.showWidth && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Width</Label>
                            <Input
                              type="number"
                              value={formatNumberForDisplay(editingItem.width)}
                              onChange={(e) => {
                                const val = parseNumberFromInput(e.target.value);
                                const updated = { ...editingItem, width: val };
                                updated.totalMeasure = calculateTotalMeasure(updated);
                                setEditingItem(updated);
                              }}
                              className="h-9 rounded-lg text-sm"
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                        )}
                        {fields.showDepth && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Depth</Label>
                            <Input
                              type="number"
                              value={formatNumberForDisplay(editingItem.depth)}
                              onChange={(e) => {
                                const val = parseNumberFromInput(e.target.value);
                                const updated = { ...editingItem, depth: val };
                                updated.totalMeasure = calculateTotalMeasure(updated);
                                setEditingItem(updated);
                              }}
                              className="h-9 rounded-lg text-sm"
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                        )}
                        {fields.showLength && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Length</Label>
                            <Input
                              type="number"
                              value={formatNumberForDisplay(editingItem.length)}
                              onChange={(e) => {
                                const val = parseNumberFromInput(e.target.value);
                                const updated = { ...editingItem, length: val };
                                updated.totalMeasure = calculateTotalMeasure(updated);
                                setEditingItem(updated);
                              }}
                              className="h-9 rounded-lg text-sm"
                              min="0"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      disabled={editingItem.qty <= 1}
                      onClick={() => {
                        const updated = { ...editingItem, qty: Math.max(1, (editingItem.qty || 1) - 1) };
                        updated.totalMeasure = calculateTotalMeasure(updated);
                        setEditingItem(updated);
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="flex-1 text-center font-semibold text-sm">
                      {editingItem.qty || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => {
                        const updated = { ...editingItem, qty: (editingItem.qty || 1) + 1 };
                        updated.totalMeasure = calculateTotalMeasure(updated);
                        setEditingItem(updated);
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Unit Price (₹)</Label>
                  <Input
                    type="number"
                    value={formatNumberForDisplay(editingItem.unit_price)}
                    onChange={(e) => {
                      const val = parseNumberFromInput(e.target.value);
                      const updated = { ...editingItem, unit_price: val };
                      setEditingItem(updated);
                    }}
                    className="h-9 rounded-lg text-sm"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Remark</Label>
                <Textarea
                  value={editingItem.remark || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, remark: e.target.value })
                  }
                  placeholder="Any specific requirement..."
                  rows={2}
                  className="rounded-lg text-sm resize-none"
                />
              </div>

              {/* Price Breakdown */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Price Breakdown
                  </span>
                </div>

                {editingItem.qty_type !== "Fixed" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Measure</span>
                      <span className="font-mono font-medium">
                        {(() => {
                          const measure = calculateTotalMeasure(editingItem);
                          return `${measure.toFixed(2)} sq.ft`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unit Price</span>
                      <span className="font-mono font-medium">
                        ₹{roundToTwo(editingItem.unit_price || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Formula</span>
                      <span className="font-mono font-medium text-[10px]">
                        {editingItem.qty_type === "ByHW" && "W × H × Qty"}
                        {editingItem.qty_type === "ByHWD" && "W × H × D × Qty"}
                        {editingItem.qty_type === "ByHWL" && "W × H × L × Qty"}
                      </span>
                    </div>
                    <div className="border-t border-primary/20 pt-2 mt-1">
                      <div className="flex justify-between text-base font-bold text-primary">
                        <span>Final Amount</span>
                        <span>
                          ₹{Math.round(calculateItemTotal(editingItem)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Unit Price</span>
                      <span className="font-mono font-medium">
                        ₹{roundToTwo(editingItem.unit_price || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-mono font-medium">
                        × {editingItem.qty || 1}
                      </span>
                    </div>
                    <div className="border-t border-primary/20 pt-2 mt-1">
                      <div className="flex justify-between text-base font-bold text-primary">
                        <span>Total</span>
                        <span>
                          ₹{Math.round(calculateItemTotal(editingItem)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl h-10 flex-1 sm:flex-none"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-10 flex-1 sm:flex-none gap-2"
              onClick={handleSaveItemEdit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={addRoomDialogOpen} onOpenChange={setAddRoomDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>
              Select a room to add to this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {loadingRooms ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableRooms.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                No rooms available to add. All rooms are already in this quotation.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableRooms.map((room) => (
                  <div
                    key={room.room_id}
                    onClick={() => setSelectedRoomToAdd(room.room_id || "")}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                      selectedRoomToAdd === room.room_id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Home className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{room.room_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.description || "No description"}
                        </p>
                      </div>
                    </div>
                    {selectedRoomToAdd === room.room_id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl h-10 flex-1 sm:flex-none"
              onClick={() => {
                setAddRoomDialogOpen(false);
                setSelectedRoomToAdd("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-10 flex-1 sm:flex-none gap-2"
              onClick={handleAddRoom}
              disabled={saving || !selectedRoomToAdd || loadingRooms}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Room
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Select a product to add to this room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Product</Label>
              <SearchableSelect
                options={getAvailableProducts(selectedRoomForProduct).map((p) => ({
                  value: p.product_id || "",
                  label: `${p.product_name} (${p.category_name || "No Category"})`,
                }))}
                value={selectedProductToAdd}
                onChange={setSelectedProductToAdd}
                placeholder="Search and select product..."
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-lg font-semibold w-12 text-center">
                  {productQuantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setProductQuantity(productQuantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl h-10 flex-1 sm:flex-none"
              onClick={() => {
                setAddProductDialogOpen(false);
                setSelectedProductToAdd("");
                setProductQuantity(1);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-10 flex-1 sm:flex-none gap-2"
              onClick={handleAddProduct}
              disabled={saving || !selectedProductToAdd}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Add Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount & GST Edit Dialog */}
      <Dialog open={discountEditOpen} onOpenChange={setDiscountEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Discount & GST</DialogTitle>
            <DialogDescription>
              Update discount and GST for this quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as "Percent" | "INR")}
              >
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Fixed Amount (₹)</SelectItem>
                  <SelectItem value="Percent">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {discountType === "Percent" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
              </Label>
              <Input
                type="number"
                value={formatNumberForDisplay(discountValue)}
                onChange={(e) => {
                  const val = parseNumberFromInput(e.target.value);
                  setDiscountValue(val);
                }}
                className="h-11 rounded-xl"
                min="0"
                step={discountType === "Percent" ? "0.1" : "1"}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>GST Percentage (%)</Label>
              <Input
                type="number"
                value={formatNumberForDisplay(gstPercent)}
                onChange={(e) => {
                  const val = parseNumberFromInput(e.target.value);
                  setGstPercent(val);
                }}
                className="h-11 rounded-xl"
                min="0"
                step="0.1"
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="gstApplicable"
                checked={isGstApplicable}
                onChange={(e) => setIsGstApplicable(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="gstApplicable" className="cursor-pointer">
                GST Applicable
              </Label>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl h-10 flex-1 sm:flex-none"
              onClick={() => setDiscountEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-10 flex-1 sm:flex-none gap-2"
              onClick={handleUpdateDiscountGst}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Item */}
      <AlertDialog
        open={!!confirmDeleteItem}
        onOpenChange={() => setConfirmDeleteItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{confirmDeleteItem?.productName}" from this quotation?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Room */}
      <AlertDialog
        open={!!confirmDeleteRoom}
        onOpenChange={() => setConfirmDeleteRoom(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{confirmDeleteRoom?.roomName}" from this quotation?
              All items in this room will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}