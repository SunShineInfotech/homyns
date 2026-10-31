// src/pages/QuotationEdit.tsx
import { FormEvent, useState, useEffect } from "react";
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
import { productCategoryService } from "@/services/product-category.service";
import { unitService } from "@/services/unit.service";
import { roomService, Room } from "@/services/room.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { WorkOrderManager } from "@/components/quotation/WorkOrderManager";
import { PRODUCTION_STATUSES, WORK_ORDER_PRIORITIES } from "@/services/workorder.service";
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
  ClipboardList,
  Sparkles,
  Ruler,
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
  "Revision Requested":
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  "Approved by Customer":
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  "Rejected by Customer":
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  "Invoice Generated":
    "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  "Work In Progress":
    "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800",
  "Work Completed":
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  "Work Stop Due To Payment":
    "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  Closed:
    "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
  Rejected:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
};

const PRODUCTION_STATUS_STYLES: Record<number, string> = {
  1: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  4: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  5: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const WORK_ORDER_PRIORITY_STYLES: Record<number, string> = {
  1: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  3: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  4: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
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
  showWorkOrders: boolean;
  onOpenWorkOrder: (product: any) => void;
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
  showWorkOrders,
  onOpenWorkOrder,
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

                      {showWorkOrders && (
                        <div className="mt-3 rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Production status</span>
                            {item.work_order_no && <span className="font-mono text-[11px] text-muted-foreground">{item.work_order_no}</span>}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={`border-0 ${PRODUCTION_STATUS_STYLES[Number(item.production_status || 1)] || PRODUCTION_STATUS_STYLES[1]}`}>
                              {item.production_status_title || PRODUCTION_STATUSES.find((status) => status.value === Number(item.production_status || 1))?.label || "Pending"}
                            </Badge>
                            <Badge className={`border-0 ${WORK_ORDER_PRIORITY_STYLES[Number(item.priority || 2)] || WORK_ORDER_PRIORITY_STYLES[2]}`}>
                              {item.priority_title || WORK_ORDER_PRIORITIES.find((priority) => priority.value === Number(item.priority || 2))?.label || "Normal"} priority
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Assigned to: <span className="font-medium text-foreground">{item.assigned_name || "Unassigned"}</span>
                          </p>
                          {item.latest_work_status && (
                            <div className="rounded-md bg-background/70 px-2.5 py-2 text-xs space-y-1">
                              <p className="text-muted-foreground">
                                Latest update: <span className="font-medium text-foreground">{item.latest_work_status.remark || "No remark"}</span>
                              </p>
                              {(item.latest_work_status.c_date || item.latest_work_status.c_time) && (
                                <p className="text-muted-foreground">
                                  {item.latest_work_status.c_date || ""}{item.latest_work_status.c_date && item.latest_work_status.c_time ? " · " : ""}{item.latest_work_status.c_time || ""}
                                  {item.latest_work_status.emp_name ? ` · ${item.latest_work_status.emp_name}` : ""}
                                </p>
                              )}
                            </div>
                          )}
                          <Button type="button" variant="outline" size="sm" className="w-full gap-2 rounded-lg" onClick={() => onOpenWorkOrder(item)}>
                            <ClipboardList className="h-4 w-4" />
                            Update product work order
                          </Button>
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
  const [workOrderManagerOpen, setWorkOrderManagerOpen] = useState(false);
  const [workOrderProduct, setWorkOrderProduct] = useState<any | null>(null);

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
  const [quickAddProductOpen, setQuickAddProductOpen] = useState(false);
  const [quickAddProductSaving, setQuickAddProductSaving] = useState(false);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [productUnits, setProductUnits] = useState<any[]>([]);
  const [quickProduct, setQuickProduct] = useState({ product_name: "", category_id: "", qty_type: "Fixed", height: 0, width: 0, depth: 0, length: 0, dimension_unit_id: "", price: 0, gst_percent: 0, description: "" });

  // Room-wise bulk pricing dialog.
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [bulkUnitPrices, setBulkUnitPrices] = useState<Record<string, string>>({});
  const [bulkItemEdits, setBulkItemEdits] = useState<Record<string, { qty_type?: string; qty?: string; dimension_unit?: string }>>({});
  const [bulkDeletedItemIds, setBulkDeletedItemIds] = useState<string[]>([]);

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
  const fetchData = async (showPageLoader = true) => {
    if (!id) return;
    if (showPageLoader) setLoading(true);
    try {
      const [quotationRes, historyRes] = await Promise.all([
        quotationService.getQuotation(id),
        quotationStatusService.getStatusHistory(id),
      ]);

      // The status history is the source of truth when the quotation row's
      // status is stale. The API returns history oldest-first, so the last
      // entry is the current quotation status.
      const history = historyRes.status === "success" && Array.isArray(historyRes.data)
        ? historyRes.data
        : [];
      const latestHistoryStatus = history.length > 0
        ? String(history[history.length - 1].status || "").trim()
        : "";

      if (quotationRes.status === "success" && quotationRes.data) {
        const currentStatus = latestHistoryStatus || quotationRes.data.status || "Pending";
        setQuotation({ ...quotationRes.data, status: currentStatus });
        setSelectedStatus(currentStatus);
        setDiscountType((quotationRes.data.discount_type as "Percent" | "INR") || "INR");
        setDiscountValue(quotationRes.data.discount_value || 0);
        setGstPercent(quotationRes.data.gst_percent || 0);
        setIsGstApplicable(quotationRes.data.gst_applicable !== false);

        // Set room order from the fetched data (already sorted by sort_order)
        const rooms = quotationRes.data.rooms || [];
        setRoomOrder(rooms);
        setExpandedRooms((current) => {
          const availableIds = new Set(rooms.map((room: any) => String(room.qr_id)));
          const stillExpanded = [...current].filter((roomId) => availableIds.has(String(roomId)));
          return new Set(stillExpanded.length ? stillExpanded : rooms.length ? [rooms[0].qr_id] : []);
        });
      } else {
        toast({
          title: "Error",
          description: quotationRes.message || "Failed to fetch quotation",
          variant: "destructive",
        });
        navigate("/quotations");
        return;
      }

      setStatusHistory(history);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      navigate("/quotations");
    } finally {
      if (showPageLoader) setLoading(false);
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
        if (selectedStatus === "Work In Progress") {
          const walletResult = res as typeof res & { wallet_updated?: boolean; wallet_added?: number; customer_wallet?: number };
          if (walletResult.wallet_updated) {
            const added = `₹${(Number(walletResult.wallet_added) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const balance = `₹${(Number(walletResult.customer_wallet) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            toast({ title: "Status and customer wallet updated", description: `${added} added to ${quotation.client_name || "the customer"}'s wallet. New wallet balance: ${balance}.` });
          } else {
            toast({ title: "Status updated; wallet update not confirmed", description: "The configured API did not confirm a wallet adjustment. Deploy the updated quotation API to the configured v2_api server folder.", variant: "destructive" });
          }
        } else {
          toast({ title: "Success", description: "Status updated successfully" });
        }
        setStatusDialogOpen(false);
        setStatusRemark("");
        await fetchData(false);
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
        await fetchData(false);
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
        await fetchData(false);
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
        await fetchData(false);
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

  const openQuickAddProductDialog = async () => {
    setQuickProduct({ product_name: "", category_id: "", qty_type: "Fixed", height: 0, width: 0, depth: 0, length: 0, dimension_unit_id: "", price: 0, gst_percent: 0, description: "" });
    setQuickAddProductOpen(true);
    try {
      const [categoryResult, unitResult] = await Promise.all([productCategoryService.getCategories(getCompanyId()), unitService.getUnits(getCompanyId())]);
      if (categoryResult.status === "success") setProductCategories(categoryResult.data || []);
      if (unitResult.status === "success") setProductUnits(unitResult.data || []);
    } catch (e: any) {
      toast({ title: "Could not load product form options", description: e.message, variant: "destructive" });
    }
  };

  const handleQuickAddProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!quotation || !selectedRoomForProduct) return;
    if (!quickProduct.product_name.trim() || !quickProduct.category_id || quickProduct.price <= 0) {
      toast({ title: "Complete required product fields", description: "Product name, category, and a price above zero are required.", variant: "destructive" });
      return;
    }
    setQuickAddProductSaving(true);
    try {
      const form = new FormData();
      form.append("type", "1"); form.append("company_id", getCompanyId()); form.append("product_name", quickProduct.product_name.trim()); form.append("category_id", quickProduct.category_id);
      form.append("qty_type", quickProduct.qty_type); form.append("height", String(quickProduct.height || 0)); form.append("width", String(quickProduct.width || 0));
      form.append("depth", String(quickProduct.depth || 0)); form.append("length", String(quickProduct.length || 0)); form.append("dimension_unit_id", quickProduct.dimension_unit_id);
      form.append("price", String(quickProduct.price)); form.append("gst_percent", String(quickProduct.gst_percent || 0)); form.append("description", quickProduct.description.trim());
      form.append("status", "Active"); form.append("product_details", JSON.stringify([]));
      const created: any = await productService.addProduct(form);
      if (created.status !== "success") { toast({ title: "Could not create product", description: created.message, variant: "destructive" }); return; }

      const refreshed = await productService.getProducts(getCompanyId());
      const refreshedProducts = refreshed.status === "success" ? refreshed.data || [] : [];
      setProducts(refreshedProducts);
      const createdId = String(created.product_id || created.data?.product_id || "");
      const product = refreshedProducts.find((p) => String(p.product_id) === createdId)
        || refreshedProducts.filter((p) => p.product_name.trim() === quickProduct.product_name.trim()).sort((a, b) => Number(b.product_id) - Number(a.product_id))[0];
      if (!product?.product_id) { toast({ title: "Product created", description: "The product is in your product master, but could not be linked to this quotation yet." }); setQuickAddProductOpen(false); return; }

      const room = roomOrder.find((r: any) => String(r.qr_id) === String(selectedRoomForProduct));
      const item = { product_id: product.product_id, qty_type: product.qty_type || "Fixed", qty: productQuantity || 1, height: Number(product.height) || 0, width: Number(product.width) || 0, depth: Number(product.depth) || 0, length: Number(product.length) || 0, dimension_unit: "inches", unit_price: Number(product.price) || 0 };
      const result = await quotationService.addQuotationProduct({ type: 8, quotation_id: quotation.quotation_id, company_id: getCompanyId(), qr_id: selectedRoomForProduct, room_id: room?.room_id || "", ...item, total_price: calculateItemTotal(item), remark: "" });
      if (result.status !== "success") { toast({ title: "Product created but not added", description: result.message || "Select it from the product list and add it again.", variant: "destructive" }); setQuickAddProductOpen(false); return; }
      toast({ title: "Product created and added", description: `${product.product_name} was added to ${room?.room_name || "the selected room"}.` });
      setQuickAddProductOpen(false); setAddProductDialogOpen(false); setSelectedProductToAdd(""); setProductQuantity(1); await fetchData(false);
    } catch (e: any) {
      toast({ title: "Could not create product", description: e?.response?.data?.message || e.message || "Something went wrong.", variant: "destructive" });
    } finally { setQuickAddProductSaving(false); }
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

  const openBulkPriceDialog = () => {
    const prices: Record<string, string> = {};
    roomOrder.forEach((room: any) => (room.items || []).forEach((item: any) => { prices[String(item.qp_id)] = String(item.unit_price ?? 0); }));
    setBulkUnitPrices(prices);
    setBulkItemEdits({});
    setBulkDeletedItemIds([]);
    if (quotation) {
      setDiscountType((quotation.discount_type as "Percent" | "INR") || "INR");
      setDiscountValue(Number(quotation.discount_value) || 0);
      setGstPercent(Number(quotation.gst_percent) || 0);
      setIsGstApplicable(quotation.gst_applicable === true || Number(quotation.gst_applicable) === 1);
    }
    setBulkPriceOpen(true);
  };

  const bulkSubtotal = roomOrder.reduce((sum: number, room: any) => sum + (room.items || []).reduce((roomSum: number, item: any) => {
    const key = String(item.qp_id); if (bulkDeletedItemIds.includes(key)) return roomSum;
    const updated = { ...item, ...(bulkItemEdits[key] || {}), qty: Number(bulkItemEdits[key]?.qty ?? item.qty ?? 1), unit_price: Number(bulkUnitPrices[key] ?? item.unit_price) || 0 };
    return roomSum + calculateItemTotal(updated);
  }, 0), 0);
  const bulkDiscountAmount = Math.min(bulkSubtotal, discountType === "Percent" ? bulkSubtotal * Math.min(100, Math.max(0, discountValue)) / 100 : Math.max(0, discountValue));
  const bulkAfterDiscount = Math.max(0, bulkSubtotal - bulkDiscountAmount);
  const bulkGstAmount = isGstApplicable ? bulkAfterDiscount * Math.max(0, gstPercent) / 100 : 0;
  const bulkFinalAmount = bulkAfterDiscount + bulkGstAmount;

  const saveBulkPricing = async () => {
    if (!quotation) return;
    setSaving(true);
    try {
      const updatedPrices = new Map<string, number>();
      for (const qpId of bulkDeletedItemIds) {
        const removed = await quotationService.deleteQuotationProduct({ type: 10, quotation_id: quotation.quotation_id, qp_id: qpId, company_id: getCompanyId() });
        if (removed.status !== "success") { setBulkPriceOpen(false); await fetchData(false); toast({ title: "Could not remove product", description: removed.message || "The product could not be removed.", variant: "destructive" }); return; }
      }
      for (const room of roomOrder) {
        for (const item of room.items || []) {
          const qpId = String(item.qp_id || "");
          if (bulkDeletedItemIds.includes(qpId)) continue;
          const edit = bulkItemEdits[qpId] || {};
          const changed = { ...item, ...edit, qty: Number(edit.qty ?? item.qty ?? 1), unit_price: Number(bulkUnitPrices[qpId] ?? item.unit_price) || 0 };
          const price = Math.max(0, Number(bulkUnitPrices[qpId] ?? item.unit_price) || 0);
          updatedPrices.set(qpId, price);
          const itemChanged = (edit.qty_type && edit.qty_type !== item.qty_type)
            || (edit.dimension_unit && edit.dimension_unit !== item.dimension_unit)
            || (edit.qty !== undefined && Number(edit.qty) !== Number(item.qty || item.quantity || 1));
          if (!qpId || (!itemChanged && Math.abs(price - (Number(item.unit_price) || 0)) < 0.005)) continue;
          const payload = {
            type: 9, quotation_id: quotation.quotation_id, qp_id: qpId, company_id: getCompanyId(), product_id: item.product_id,
            qty_type: changed.qty_type || "Fixed", qty: changed.qty || 1, height: item.height || 0, width: item.width || 0,
            depth: item.depth || 0, length: item.length || 0, dimension_unit: changed.dimension_unit || "feet", unit_price: price,
            total_price: calculateItemTotal({ ...changed, unit_price: price }), remark: item.remark || "",
          };
          const update = await quotationService.updateQuotationProduct(payload);
          if (update.status !== "success") { setBulkPriceOpen(false); await fetchData(false); toast({ title: "Some prices were saved", description: update.message || "The remaining prices could not be updated. Reopen Change Bulk Price to continue from the saved prices.", variant: "destructive" }); return; }
        }
      }
      const subtotal = roundToTwo(roomOrder.reduce((sum: number, room: any) => sum + (room.items || []).reduce((roomSum: number, item: any) => {
        const key = String(item.qp_id); if (bulkDeletedItemIds.includes(key)) return roomSum;
        const edit = bulkItemEdits[key] || {};
        return roomSum + calculateItemTotal({ ...item, ...edit, qty: Number(edit.qty ?? item.qty ?? 1), unit_price: updatedPrices.get(key) ?? Number(item.unit_price) });
      }, 0), 0));
      const discountAmount = roundToTwo(Math.min(subtotal, discountType === "Percent" ? subtotal * Math.min(100, Math.max(0, discountValue)) / 100 : Math.max(0, discountValue)));
      const afterDiscount = Math.max(0, subtotal - discountAmount);
      const gstAmount = roundToTwo(isGstApplicable ? afterDiscount * Math.max(0, gstPercent) / 100 : 0);
      const result = await quotationService.updateQuotationDiscountGst({ type: 13, quotation_id: quotation.quotation_id, company_id: getCompanyId(), discount_type: discountType, discount_value: discountValue, discount_amount: discountAmount, amount_after_discount: afterDiscount, gst_applicable: isGstApplicable ? 1 : 0, gst_percent: gstPercent, gst_amount: gstAmount, final_amount: afterDiscount + gstAmount });
      if (result.status !== "success") { setBulkPriceOpen(false); await fetchData(false); toast({ title: "Prices saved, discount/GST update failed", description: result.message || "Reopen Change Bulk Price to review and update totals.", variant: "destructive" }); return; }
      toast({ title: "Quotation prices updated", description: "Product prices, discount, GST, and totals were saved." });
      setBulkPriceOpen(false); await fetchData(false);
    } catch (e: any) {
      await fetchData(false);
      toast({ title: "Could not save bulk pricing", description: e?.response?.data?.message || e.message || "Something went wrong.", variant: "destructive" });
    } finally { setSaving(false); }
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
            <Button variant="outline" className="gap-2 rounded-xl" onClick={openBulkPriceDialog}>
              <IndianRupee className="w-4 h-4" />Change Bulk Price
            </Button>
            {["Work In Progress", "Work Completed", "Work Stop Due To Payment"].includes(quotation.status || "") && (
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={() => {
                  setWorkOrderProduct(null);
                  setWorkOrderManagerOpen(true);
                }}
              >
                <ClipboardList className="w-4 h-4" />
                Work Orders
              </Button>
            )}
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
                          showWorkOrders={["Work In Progress", "Work Completed", "Work Stop Due To Payment"].includes(quotation.status || "")}
                          onOpenWorkOrder={(product) => {
                            setWorkOrderProduct(product);
                            setWorkOrderManagerOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Card>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
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

              <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
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

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold" />
                  Package Details
                </h4>
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">Package Name</p>
                  <p className="font-medium">{quotation.package_name || "Custom package"}</p>
                  {quotation.package_details && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {quotation.package_details}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Special Instructions
                </h4>
                <Textarea
                  value={quotation.remark || ""}
                  onChange={(e) => setQuotation({ ...quotation, remark: e.target.value })}
                  placeholder="Add special instructions..."
                  rows={4}
                  className="rounded-xl"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
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
      <WorkOrderManager
        open={workOrderManagerOpen}
        onOpenChange={(open) => {
          setWorkOrderManagerOpen(open);
          if (!open) setWorkOrderProduct(null);
        }}
        initialProduct={workOrderProduct}
        companyId={getCompanyId()}
        employeeId={getEmployeeId()}
        quotationNumber={quotation.quotation_number}
        rooms={roomOrder}
        onProductUpdated={(updatedProduct) => {
          const updateRooms = (rooms: any[]) => rooms.map((room) => ({
            ...room,
            items: (room.items || []).map((item: any) =>
              String(item.qp_id) === String(updatedProduct.qp_id) ? updatedProduct : item,
            ),
          }));
          setRoomOrder((current) => updateRooms(current));
          setQuotation((current) => current ? { ...current, rooms: updateRooms(current.rooms || []) } : current);
        }}
      />

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
            {selectedStatus === "Work In Progress" && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-semibold">Customer wallet update</p>
                <p className="mt-1">This will post <strong>{formatCurrency(Number(quotation.final_amount) || 0)}</strong> for {quotation.client_name || "this customer"} to the customer transaction ledger and increase their wallet.</p>
                <p className="mt-1 text-xs opacity-80">If this quotation was already posted, only the remaining difference will be added. It will not be charged twice. A transaction remark will include the quotation number and status.</p>
              </div>
            )}
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
                selectedStatus === "Work In Progress" ? "Confirm & Update Status" : "Update Status"
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

      {/* Room-wise bulk prices and quotation totals */}
      <Dialog open={bulkPriceOpen} onOpenChange={(open) => !saving && setBulkPriceOpen(open)}>
        <DialogContent className="max-h-[92dvh] max-w-6xl overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle>Change Bulk Price</DialogTitle><DialogDescription>Review product prices room by room, then apply quotation discount and GST. Product quantity types and measured quantities stay visible for reference.</DialogDescription></DialogHeader>
          <div className="space-y-5">
            <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { setBulkPriceOpen(false); void fetchAvailableRooms(); setAddRoomDialogOpen(true); }}><Plus className="mr-1 h-4 w-4" />Add Room</Button></div>
            {roomOrder.length === 0 ? <Card className="p-8 text-center text-sm text-muted-foreground">This quotation has no rooms yet. Add a room to begin.</Card> : roomOrder.map((room: any) => <section key={room.qr_id} className="overflow-hidden rounded-xl border">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3"><h3 className="font-semibold">{room.room_name || "Room"}</h3><Button type="button" size="sm" variant="outline" onClick={() => { setBulkPriceOpen(false); openAddProductDialog(String(room.qr_id)); }}><Plus className="mr-1 h-4 w-4" />Add Product</Button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground">{["Product Title", "Qty Type", "Unit", "Quantity", "Unit Price (₹)", "Total", ""].map(title => <th key={title} className="px-3 py-2.5 font-medium">{title}</th>)}</tr></thead><tbody className="divide-y">{(room.items || []).filter((item: any) => !bulkDeletedItemIds.includes(String(item.qp_id))).map((item: any) => { const key = String(item.qp_id); const edit = bulkItemEdits[key] || {}; const merged = { ...item, ...edit, qty: Number(edit.qty ?? item.qty ?? item.quantity ?? 1) }; const unitPrice = Number(bulkUnitPrices[key] ?? item.unit_price) || 0; const total = calculateItemTotal({ ...merged, unit_price: unitPrice }); const currentUnit = merged.dimension_unit || "feet"; const unitOptions = Array.from(new Set(["feet", "inch", currentUnit])); return <tr key={item.qp_id}><td className="px-3 py-3 font-medium">{item.product_name || item.name || "Product"}</td><td className="w-40 px-2 py-2"><Select value={merged.qty_type || "Fixed"} onValueChange={value => setBulkItemEdits(current => ({ ...current, [key]: { ...current[key], qty_type: value } }))}><SelectTrigger aria-label={`${item.product_name || item.name} quantity type`} className="h-9"><SelectValue /></SelectTrigger><SelectContent>{["Fixed", "ByHW", "ByHWD", "ByHWL"].map(value => <SelectItem key={value} value={value}>{getQtyTypeLabel(value)}</SelectItem>)}</SelectContent></Select></td><td className="w-32 px-2 py-2"><Select value={currentUnit} onValueChange={value => setBulkItemEdits(current => ({ ...current, [key]: { ...current[key], dimension_unit: value } }))}><SelectTrigger aria-label={`${item.product_name || item.name} unit`} className="h-9"><SelectValue /></SelectTrigger><SelectContent>{unitOptions.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></td><td className="w-28 px-2 py-2"><Input aria-label={`${item.product_name || item.name} quantity`} type="number" min="0.001" step="0.001" value={merged.qty} onChange={e => setBulkItemEdits(current => ({ ...current, [key]: { ...current[key], qty: e.target.value } }))} /></td><td className="w-40 px-2 py-2"><Input aria-label={`${item.product_name || item.name} unit price`} type="number" min="0" step="0.01" value={bulkUnitPrices[key] ?? String(item.unit_price || 0)} onChange={e => setBulkUnitPrices(current => ({ ...current, [key]: e.target.value }))} /></td><td className="px-3 py-3 font-semibold">{formatCurrency(total)}</td><td className="px-2 py-2"><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${item.product_name || item.name}`} onClick={() => setBulkDeletedItemIds(current => [...current, key])}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>; })}{!(room.items || []).some((item: any) => !bulkDeletedItemIds.includes(String(item.qp_id))) && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No products in this room.</td></tr>}</tbody></table></div>
            </section>)}

            <section className="grid gap-5 rounded-xl border p-4 lg:grid-cols-2"><div className="space-y-4"><div><h3 className="font-semibold">Discount & GST</h3><p className="text-sm text-muted-foreground">Update discount and GST for this quotation.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Discount Type</Label><Select value={discountType} onValueChange={v => setDiscountType(v as "Percent" | "INR")}><SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INR">Fixed Amount (₹)</SelectItem><SelectItem value="Percent">Percentage (%)</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>{discountType === "Percent" ? "Discount Percentage (%)" : "Discount Amount (₹)"}</Label><Input aria-label="Discount amount" type="number" min="0" max={discountType === "Percent" ? 100 : undefined} step="0.01" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value) || 0)} /></div><div className="space-y-1.5"><Label>GST Percentage (%)</Label><Input aria-label="GST percentage" type="number" min="0" max="100" step="0.01" value={gstPercent} onChange={e => setGstPercent(Number(e.target.value) || 0)} /></div><label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={isGstApplicable} onChange={e => setIsGstApplicable(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />GST Applicable</label></div></div>
              <div className="space-y-2 rounded-xl bg-muted/40 p-4 text-sm"><h3 className="mb-3 font-semibold">Summary</h3><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><b>{formatCurrency(bulkSubtotal)}</b></div><div className="flex justify-between"><span className="text-muted-foreground">Discount</span><b>- {formatCurrency(bulkDiscountAmount)}</b></div><div className="flex justify-between"><span className="text-muted-foreground">After Discount</span><b>{formatCurrency(bulkAfterDiscount)}</b></div><div className="flex justify-between"><span className="text-muted-foreground">GST ({isGstApplicable ? `${Number(gstPercent).toFixed(2)}%` : "Not applicable"})</span><b>{formatCurrency(bulkGstAmount)}</b></div><div className="mt-2 flex justify-between border-t pt-3 text-base"><span className="font-semibold">Total</span><b>{formatCurrency(bulkFinalAmount)}</b></div></div>
            </section>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setBulkPriceOpen(false)} disabled={saving}>Cancel</Button><Button type="button" onClick={() => void saveBulkPricing()} disabled={saving || !roomOrder.length}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save Prices & Totals</>}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Select a product to add to this room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2"><Label>Product</Label><Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => void openQuickAddProductDialog()}><Sparkles className="h-3.5 w-3.5" />Add New Product</Button></div>
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

      {/* Add New Product to product master and this quotation room */}
      <Dialog open={quickAddProductOpen} onOpenChange={(open) => !quickAddProductSaving && setQuickAddProductOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Add New Product</DialogTitle><DialogDescription>This creates a new product in your product master and adds it to the selected quotation room right away.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleQuickAddProduct}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2"><Label>Product Name *</Label><Input required autoFocus value={quickProduct.product_name} onChange={e => setQuickProduct(v => ({ ...v, product_name: e.target.value }))} placeholder="e.g. Premium Wood Table" /></div>
              <div className="space-y-1.5"><Label>Category *</Label><SearchableSelect options={productCategories.map(c => ({ value: String(c.category_id || ""), label: c.category_name }))} value={quickProduct.category_id} onChange={value => setQuickProduct(v => ({ ...v, category_id: value }))} placeholder="Select category" /></div>
              <div className="space-y-1.5"><Label>Quantity Type</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={quickProduct.qty_type} onChange={e => setQuickProduct(v => ({ ...v, qty_type: e.target.value }))}><option value="Fixed">Fixed</option><option value="ByHW">By Height × Width</option><option value="ByHWD">By Height × Width × Depth</option><option value="ByHWL">By Height × Width × Length</option></select></div>
              {quickProduct.qty_type !== "Fixed" && <div className="space-y-2 rounded-xl border border-dashed bg-muted/20 p-3 sm:col-span-2"><div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ruler className="h-3.5 w-3.5 text-primary" />Dimensions</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["height", "Height"], ["width", "Width"], ...(quickProduct.qty_type === "ByHWD" ? [["depth", "Depth"]] : []), ...(quickProduct.qty_type === "ByHWL" ? [["length", "Length"]] : [])].map(([key, label]) => <div key={key} className="space-y-1"><Label className="text-xs">{label}</Label><Input type="number" min="0" step="0.1" value={(quickProduct as any)[key]} onChange={e => setQuickProduct(v => ({ ...v, [key]: Number(e.target.value) }))} /></div>)}</div><div className="space-y-1"><Label className="text-xs">Dimension Unit</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={quickProduct.dimension_unit_id} onChange={e => setQuickProduct(v => ({ ...v, dimension_unit_id: e.target.value }))}><option value="">Select unit</option>{productUnits.map(unit => <option key={unit.unit_id} value={unit.unit_id}>{unit.unit_name}</option>)}</select></div></div>}
              <div className="space-y-1.5"><Label>Unit Price (₹) *</Label><Input required type="number" min="0.01" step="0.01" value={quickProduct.price || ""} onChange={e => setQuickProduct(v => ({ ...v, price: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label>GST Percentage (%)</Label><Input type="number" min="0" max="100" step="0.1" value={quickProduct.gst_percent} onChange={e => setQuickProduct(v => ({ ...v, gst_percent: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={quickProduct.description} onChange={e => setQuickProduct(v => ({ ...v, description: e.target.value }))} /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setQuickAddProductOpen(false)} disabled={quickAddProductSaving}>Cancel</Button><Button type="submit" disabled={quickAddProductSaving}>{quickAddProductSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating & adding…</> : <><Plus className="mr-2 h-4 w-4" />Create & Add to Room</>}</Button></DialogFooter>
          </form>
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
