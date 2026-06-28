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
import { toast } from "@/hooks/use-toast";
import { quotationService, Quotation } from "@/services/quotation.service";
import {
  quotationStatusService,
  QUOTATION_STATUSES,
  QuotationStatusHistory,
} from "@/services/quotation-status.service";
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
  AlertCircle,
  ChevronUp,
  ChevronDown,
  MapPin,
  Calendar,
  UserCheck,
  IndianRupee as RupeeIcon,
  Hash,
  CreditCard,
  Briefcase,
} from "lucide-react";

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

export default function QuotationEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [statusHistory, setStatusHistory] = useState<QuotationStatusHistory[]>(
    [],
  );
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusRemark, setStatusRemark] = useState("");
  const [updating, setUpdating] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

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
        // Expand first room by default
        if (quotationRes.data.rooms && quotationRes.data.rooms.length > 0) {
          setExpandedRooms(new Set([quotationRes.data.rooms[0].qr_id]));
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

  useEffect(() => {
    fetchData();
  }, [id]);

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

  // Get client data from quotation
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
        address: quotation.address || quotation.address || "—",
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
          <Button
            onClick={() => setStatusDialogOpen(true)}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            Change Status
          </Button>
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
            {/* Client Details - Full */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Client Details
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

            {/* Package Details */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-gold" />
                Package Details
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

            {/* Room-wise Breakdown */}
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Room-wise Breakdown
              </h3>
              {quotation.rooms && quotation.rooms.length > 0 ? (
                <div className="space-y-4">
                  {quotation.rooms.map((room: any) => {
                    const isExpanded = expandedRooms.has(room.qr_id);
                    const roomTotal = parseFloat(room.room_total) || 0;
                    const items = room.items || [];

                    return (
                      <div
                        key={room.qr_id}
                        className="rounded-xl border border-border overflow-hidden"
                      >
                        <div
                          className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => toggleRoom(room.qr_id)}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {room.room_name ||
                                  `Room ${room.sort_order + 1}`}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {items.length} items
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground">
                              {formatCurrency(roomTotal)}
                            </span>
                            <ChevronUp
                              className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "" : "rotate-180"}`}
                            />
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 space-y-4">
                            {items.map((item: any, idx: number) => {
                              const calculatedQty =
                                parseFloat(item.calculated_qty) || 0;
                              const unitPrice =
                                parseFloat(item.unit_price) || 0;
                              const totalPrice =
                                parseFloat(item.total_price) || 0;
                              const qtyType = item.qty_type || "Fixed";
                              const isDimensionBased = qtyType !== "Fixed";

                              return (
                                <div
                                  key={item.qp_id || idx}
                                  className="rounded-lg border border-border/50 p-4 bg-card"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h5 className="font-semibold text-foreground">
                                        {item.product_name}
                                      </h5>
                                      <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <Badge
                                          variant="outline"
                                          className="text-[10px]"
                                        >
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
                                    <div className="text-right">
                                      <p className="font-bold text-primary">
                                        {formatCurrency(totalPrice)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Unit: {formatCurrency(unitPrice)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-muted/20 rounded-lg p-3 mb-3">
                                    {isDimensionBased ? (
                                      <>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Height
                                          </span>
                                          <p className="font-medium">
                                            {item.height || 0}{" "}
                                            {item.dimension_unit || "ft"}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Width
                                          </span>
                                          <p className="font-medium">
                                            {item.width || 0}{" "}
                                            {item.dimension_unit || "ft"}
                                          </p>
                                        </div>
                                        {qtyType === "ByHWD" && (
                                          <div>
                                            <span className="text-muted-foreground">
                                              Depth
                                            </span>
                                            <p className="font-medium">
                                              {item.depth || 0}{" "}
                                              {item.dimension_unit || "ft"}
                                            </p>
                                          </div>
                                        )}
                                        {qtyType === "ByHWL" && (
                                          <div>
                                            <span className="text-muted-foreground">
                                              Length
                                            </span>
                                            <p className="font-medium">
                                              {item.length || 0}{" "}
                                              {item.dimension_unit || "ft"}
                                            </p>
                                          </div>
                                        )}
                                        <div>
                                          <span className="text-muted-foreground">
                                            Calculated Qty
                                          </span>
                                          <p className="font-medium">
                                            {calculatedQty.toFixed(2)} sq.ft
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Quantity
                                          </span>
                                          <p className="font-medium">
                                            {item.qty || 0}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">
                                            Unit Price
                                          </span>
                                          <p className="font-medium">
                                            {formatCurrency(unitPrice)}
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {item.raw_materials &&
                                    item.raw_materials.length > 0 && (
                                      <div className="bg-secondary/10 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Raw Materials
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className="text-[9px] px-1.5 py-0"
                                          >
                                            {item.raw_materials.length}
                                          </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {item.raw_materials.map(
                                            (rm: any, rIdx: number) => (
                                              <Badge
                                                key={rIdx}
                                                variant="secondary"
                                                className="text-xs px-2 py-1 rounded-md"
                                              >
                                                {rm.rm_name ||
                                                  rm.name ||
                                                  "Material"}
                                                {rm.required_qty &&
                                                  ` (${parseFloat(rm.required_qty).toFixed(2)} ${rm.unit || ""})`}
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {item.remark && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      <span className="font-medium">
                                        Remark:
                                      </span>{" "}
                                      {item.remark}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No items found
                </p>
              )}
            </Card>

            {/* Special Instructions */}
            {quotation.remark && (
              <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Special Instructions
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {quotation.remark}
                </p>
              </Card>
            )}
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
                    <span className="text-muted-foreground">
                      After Discount
                    </span>
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
                  <span className="font-mono">
                    {quotation.quotation_number}
                  </span>
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
    </MainLayout>
  );
}
