// src/pages/QuotationView.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { quotationService, Quotation } from "@/services/quotation.service";
import { employeeService, Employee } from "@/services/employee.service";
import { API_URL } from "@/services/api.config";
import {
  PRODUCTION_STATUSES,
  WORK_ORDER_PRIORITIES,
  WorkOrderHistoryEntry,
  workOrderService,
} from "@/services/workorder.service";
import {
  quotationStatusService,
  QUOTATION_STATUSES,
  QuotationStatusHistory,
} from "@/services/quotation-status.service";
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Layers,
  Building2,
  ChevronDown,
  ChevronRight,
  Printer,
  Download,
  MapPin,
  CreditCard,
  Calendar,
  ClipboardList,
  History,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  'Approved by Admin': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Sent to Customer': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
  'Revision Requested': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  'Approved by Customer': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'Rejected by Customer': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  'Invoice Generated': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  'Work In Progress': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  'Work Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  'Work Stop Due To Payment': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  'Closed': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
  'Rejected': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

const STATUS_ICONS: Record<string, any> = {
  'Pending': Clock,
  'Approved by Admin': CheckCircle2,
  'Sent to Customer': CheckCircle2,
  'Revision Requested': RefreshCw,
  'Approved by Customer': CheckCircle2,
  'Rejected by Customer': AlertCircle,
  'Invoice Generated': FileText,
  'Work In Progress': RefreshCw,
  'Work Completed': CheckCircle2,
  'Work Stop Due To Payment': CreditCard,
  'Closed': CheckCircle2,
  'Rejected': AlertCircle,
};

const WORK_ORDER_QUOTATION_STATUSES = new Set([
  "Work In Progress",
  "Work Completed",
  "Work Stop Due To Payment",
]);

const PRODUCTION_STATUS_STYLES: Record<number, string> = {
  1: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  4: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  5: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const PRIORITY_STYLES: Record<number, string> = {
  1: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  3: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  4: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const getWorkOrderImageUrl = (imagePath?: string) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const apiBaseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  return new URL(imagePath.replace(/^\/+/, ""), apiBaseUrl).toString();
};

const formatWorkHistoryDate = (entry: WorkOrderHistoryEntry) => {
  const date = entry.c_date || entry.c_datetime?.slice(0, 10);
  if (!date) return "Date unavailable";
  const formattedDate = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = entry.c_time || entry.c_datetime?.slice(11, 19);
  return `${formattedDate}${time ? ` · ${time} IST` : ""}`;
};

const formatWorkOrderDate = (value?: string) => {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

export default function QuotationView({ documentType = "quotation" }: { documentType?: "quotation" | "invoice" }) {
  const isInvoice = documentType === "invoice";
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [statusHistory, setStatusHistory] = useState<QuotationStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusRemark, setStatusRemark] = useState("");
  const [updating, setUpdating] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [workOrderHistory, setWorkOrderHistory] = useState<WorkOrderHistoryEntry[]>([]);
  const [loadingWorkOrderHistory, setLoadingWorkOrderHistory] = useState(false);
  const [savingWorkOrder, setSavingWorkOrder] = useState(false);
  const [productionStatus, setProductionStatus] = useState("1");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("2");
  const [workRemark, setWorkRemark] = useState("");
  const [workImage, setWorkImage] = useState<File | null>(null);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { return ""; }
    return "";
  };

  const getEmployeeId = (): string => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) return JSON.parse(raw)?.emp_id || "";
    } catch { return ""; }
    return "";
  };

  useEffect(() => {
    const companyId = getCompanyId();
    if (!companyId) return;
    employeeService.getEmployees(companyId).then((res) => {
      if (res.status === "success" && res.data) setEmployees(res.data);
    });
  }, []);

  const openWorkOrderDialog = async (product: any) => {
    if (!product?.qp_id) {
      toast({ title: "Work order unavailable", description: "This product is missing its quotation product ID.", variant: "destructive" });
      return;
    }

    setActiveProduct(product);
    setProductionStatus(String(product.production_status || 1));
    setAssignedTo(product.assigned_to || "");
    setPriority(String(product.priority || 2));
    setWorkRemark("");
    setWorkImage(null);
    setWorkOrderHistory([]);
    setWorkOrderDialogOpen(true);
    setLoadingWorkOrderHistory(true);

    const res = await workOrderService.getProductHistory(getCompanyId(), String(product.qp_id));
    if (res.status === "success") {
      setWorkOrderHistory(res.data || []);
    } else {
      toast({ title: "History unavailable", description: res.message, variant: "destructive" });
    }
    setLoadingWorkOrderHistory(false);
  };

  const handleSaveWorkOrder = async () => {
    if (!activeProduct?.qp_id || !quotation?.quotation_id) return;
    setSavingWorkOrder(true);
    try {
      let imageBase64: string | undefined;
      if (workImage) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error || new Error("Could not read image"));
          reader.readAsDataURL(workImage);
        });
      }

      const res = await workOrderService.updateProduct({
        company_id: getCompanyId(),
        qp_id: String(activeProduct.qp_id),
        emp_id: getEmployeeId(),
        production_status: Number(productionStatus),
        assigned_to: assignedTo,
        priority: Number(priority),
        remark: workRemark.trim(),
        image_base64: imageBase64,
      });

      if (res.status !== "success") {
        toast({ title: "Could not save work order", description: res.message, variant: "destructive" });
        return;
      }

      const assignedName = employees.find((employee) => employee.emp_id === assignedTo)?.name || "";
      const updatedProduct = {
        ...activeProduct,
        production_status: Number(productionStatus),
        production_status_title: PRODUCTION_STATUSES.find((status) => status.value === Number(productionStatus))?.label,
        assigned_to: assignedTo,
        assigned_name: assignedName,
        priority: Number(priority),
        priority_title: WORK_ORDER_PRIORITIES.find((item) => item.value === Number(priority))?.label,
        work_order_no: res.work_order_no || activeProduct.work_order_no,
        latest_work_status: {
          status: Number(productionStatus),
          status_title: PRODUCTION_STATUSES.find((status) => status.value === Number(productionStatus))?.label,
          remark: workRemark.trim(),
          image: res.image || "",
          emp_name: employees.find((employee) => String(employee.emp_id) === String(getEmployeeId()))?.name || "",
        },
      };
      setActiveProduct(updatedProduct);
      setQuotation((current) => current ? {
        ...current,
        rooms: (current.rooms || []).map((room: any) => ({
          ...room,
          items: (room.items || []).map((item: any) =>
            String(item.qp_id) === String(activeProduct.qp_id) ? updatedProduct : item,
          ),
        })),
      } : current);
      setWorkRemark("");
      setWorkImage(null);
      const historyRes = await workOrderService.getProductHistory(getCompanyId(), String(activeProduct.qp_id));
      if (historyRes.status === "success") setWorkOrderHistory(historyRes.data || []);
      toast({ title: "Saved", description: "Product work order and history have been updated." });
    } catch (error: any) {
      toast({ title: "Could not save work order", description: error?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSavingWorkOrder(false);
    }
  };

  // ─── Fetch Quotation Data via quotationService (same as Edit page) ──────
  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [quotationRes, historyRes] = await Promise.all([
        quotationService.getQuotation(id),
        quotationStatusService.getStatusHistory(id),
      ]);

      const fetchedStatusHistory = historyRes.status === "success" && Array.isArray(historyRes.data)
        ? historyRes.data
        : [];
      const latestQuotationStatus = fetchedStatusHistory.length
        ? String(fetchedStatusHistory[fetchedStatusHistory.length - 1].status || "").trim()
        : "";

      if (quotationRes.status === "success" && quotationRes.data) {
        const data: any = { ...quotationRes.data };
        if (latestQuotationStatus) data.status = latestQuotationStatus;

        // rooms may come back as a JSON string from the API; normalize it
        if (data.rooms && typeof data.rooms === "string") {
          try {
            data.rooms = JSON.parse(data.rooms);
          } catch {
            data.rooms = [];
          }
        }
        if (!data.rooms) data.rooms = [];

        setQuotation(data);
        setSelectedStatus(data.status || "Pending");

        // Expand first room by default
        if (data.rooms.length > 0) {
          setExpandedRooms(new Set([data.rooms[0].qr_id]));
        }
      } else {
        toast({ title: "Error", description: quotationRes.message || "Failed to fetch quotation", variant: "destructive" });
        navigate("/quotations");
        return;
      }

      setStatusHistory(fetchedStatusHistory);
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      navigate("/quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ─── Update Status ──────────────────────────────────────────────────────
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
        await fetchData();
      } else {
        toast({ title: "Error", description: res.message || "Failed to update status", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
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
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const latestInvoiceHistory = [...statusHistory]
    .filter((entry) => String(entry.status || "").trim() === "Invoice Generated")
    .sort((a, b) => `${b.c_date || ""} ${b.c_time || ""}`.localeCompare(`${a.c_date || ""} ${a.c_time || ""}`))[0];
  const documentDate = (entry?: QuotationStatusHistory) => {
    if (!entry?.c_date) return "—";
    const date = new Date(`${entry.c_date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
    return `${date}${entry.c_time ? ` · ${entry.c_time.slice(0, 5)} IST` : ""}`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount || 0).toLocaleString()}`;
  };

  const getUnitLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'Fixed': 'Nos',
      'ByHW': 'Sq. Ft',
      'ByHWD': 'Sq. Ft',
      'ByHWL': 'Sq. Ft',
    };
    return labels[type] || 'Nos';
  };

  if (loading) {
    return (
      <MainLayout title={isInvoice ? "Invoice Details" : "Quotation Details"} subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!quotation) {
    return (
      <MainLayout title={isInvoice ? "Invoice Details" : "Quotation Details"} subtitle="Not found">
        <div className="text-center py-20">
          <p className="text-muted-foreground">{isInvoice ? "Invoice" : "Quotation"} not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/quotations")}>
            Back to List
          </Button>
        </div>
      </MainLayout>
    );
  }

  const q: any = quotation;
  const StatusIcon = STATUS_ICONS[q.status || 'Pending'] || Clock;
  const showWorkOrders = WORK_ORDER_QUOTATION_STATUSES.has(q.status || "");

  // Client fields — same fallback pattern as the working Edit page
  const clientPhone =
    [q.phone, q.phone1, q.phone2, q.whatsapp_number].filter(Boolean).join(", ") || "—";
  const clientEmail = q.email || q.client_email || "—";
  const clientAddress = q.address || q.client_address || "—";
  const clientCity = q.city || q.client_city || "";
  const clientState = q.state || q.client_state || "";
  const clientGst = q.gst_number || q.client_gst || "";

  return (
    <MainLayout title={`${isInvoice ? "Invoice" : "Quotation"} ${quotation.quotation_number}`} subtitle={`View ${isInvoice ? "invoice" : "quotation"} details`}>
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .quotation-print-root, .quotation-print-root * { visibility: visible !important; }
        .quotation-print-root { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 12mm !important; }
        .quotation-print-controls, .quotation-interactive { display: none !important; }
        .quotation-print-root .shadow-soft { box-shadow: none !important; }
        .quotation-work-order-page { break-before: page; page-break-before: always; }
        .quotation-print-root { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }`}</style>
      <div className="quotation-print-root space-y-6 max-w-7xl mx-auto">
        {/* Action Buttons */}
        <div className="quotation-print-controls flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.print()}>
              <Download className="w-4 h-4" /> Save as PDF
            </Button>
            {!isInvoice && <Button onClick={() => setStatusDialogOpen(true)} className="gap-2 rounded-xl">
              <RefreshCw className="w-4 h-4" />
              Change Status
            </Button>}
          </div>
        </div>

        {/* ─── QUOTATION HEADER ─────────────────────────────────────────────── */}
        <Card className="p-6 bg-card border-border shadow-soft rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* Company Details */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{q.company_name || "Company Name"}</h2>
                {q.company_address && (
                  <p className="text-sm text-muted-foreground mt-0.5">{q.company_address}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                  {q.company_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {q.company_email}
                    </span>
                  )}
                  {q.company_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {q.company_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="text-left md:text-right space-y-1">
              <div className="flex items-center md:justify-end gap-3">
                <h3 className="text-2xl font-display font-bold text-primary">{quotation.quotation_number}</h3>
                {isInvoice ? <Badge className="border border-emerald-200 bg-emerald-100 px-3 py-1 text-emerald-800"><FileText className="mr-1.5 h-3 w-3"/>Invoice</Badge> : <Badge className={`${STATUS_COLORS[quotation.status || 'Pending']} border px-3 py-1`}><StatusIcon className="w-3 h-3 mr-1.5" />{quotation.status || 'Pending'}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {isInvoice ? "Invoice Date" : "Date"}: {isInvoice ? documentDate(latestInvoiceHistory) : quotation.c_date ? new Date(quotation.c_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isInvoice ? "Generated by" : "Created by"}: {isInvoice ? latestInvoiceHistory?.emp_name || quotation.generated_by_name || "—" : quotation.generated_by_name || "—"}
              </p>
            </div>
          </div>
        </Card>

        {/* ─── CLIENT DETAILS ─────────────────────────────────────────────────── */}
        <Card className="p-6 bg-card border-border shadow-soft rounded-2xl">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {isInvoice ? "Bill To" : "Client Details"}
          </h3>
          <div className="space-y-3">
            <p className="font-semibold text-foreground text-lg">{quotation.client_name}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{clientPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{clientEmail}</span>
              </div>
            </div>
            {clientAddress && clientAddress !== "—" && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1 border-t border-border/50">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span>{clientAddress}</span>
                  {clientCity && <span>, {clientCity}</span>}
                  {clientState && <span>, {clientState}</span>}
                </div>
              </div>
            )}
            {clientGst && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t border-border/50">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>GST: {clientGst}</span>
              </div>
            )}
          </div>
        </Card>

        {/* ─── ROOM-WISE ITEMS ─────────────────────────────────────────────────── */}
        <Card className="p-6 bg-card border-border shadow-soft rounded-2xl">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            {isInvoice ? "Invoice Items" : "Room-wise Items"}
          </h3>

          {q.rooms && q.rooms.length > 0 ? (
            <div className="space-y-6">
              {q.rooms.map((room: any, roomIndex: number) => {
                const isExpanded = expandedRooms.has(room.qr_id);
                const roomTotal = parseFloat(room.room_total) || 0;
                const items = room.items || [];

                return (
                  <div key={room.qr_id || roomIndex} className="rounded-xl border border-border overflow-hidden">
                    {/* Room Header */}
                    <div
                      className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => toggleRoom(room.qr_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold text-foreground">{room.room_name || `Room ${(room.sort_order ?? roomIndex) + 1}`}</h4>
                          <p className="text-xs text-muted-foreground">{items.length} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{formatCurrency(roomTotal)}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Responsive product cards */}
                    {isExpanded && (
                      <div className="space-y-4 p-3 sm:p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {items.map((item: any, idx: number) => {
                            const qtyType = item.qty_type || "Fixed";
                            const unit = getUnitLabel(qtyType);
                            const calculatedQty = parseFloat(item.calculated_qty) || 0;
                            const unitPrice = parseFloat(item.unit_price) || 0;
                            const totalPrice = parseFloat(item.total_price) || 0;
                            const width = parseFloat(item.width) || 0;
                            const height = parseFloat(item.height) || 0;
                            const depth = parseFloat(item.depth) || 0;
                            const length = parseFloat(item.length) || 0;
                            const productionStatus = Number(item.production_status || 1);
                            const priorityValue = Number(item.priority || 2);
                            const assignedName = item.assigned_name || employees.find((employee) => employee.emp_id === item.assigned_to)?.name;
                            const workHistoryCount = Number(item.work_status_history_count || 0);

                            return (
                              <div key={item.qp_id || idx} className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Product {idx + 1}</p>
                                    <h5 className="font-semibold break-words">{item.product_name || "Product"}</h5>
                                    {item.is_special === "1" && (
                                      <Badge variant="secondary" className="mt-1 text-[10px] bg-amber-500/10 text-amber-600">Special</Badge>
                                    )}
                                  </div>
                                  <p className="shrink-0 font-bold text-primary">{formatCurrency(totalPrice)}</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-sm">
                                  <div><p className="text-[11px] text-muted-foreground">Width</p><p>{width || "—"}</p></div>
                                  <div><p className="text-[11px] text-muted-foreground">Height</p><p>{height || "—"}</p></div>
                                  <div><p className="text-[11px] text-muted-foreground">Depth / Length</p><p>{qtyType === "ByHWD" ? depth : qtyType === "ByHWL" ? length : "—"}</p></div>
                                  <div><p className="text-[11px] text-muted-foreground">Quantity</p><p>{item.qty || 1} {unit}</p></div>
                                  <div><p className="text-[11px] text-muted-foreground">Total Measure</p><p>{qtyType === "Fixed" ? (item.qty || 1) : `${calculatedQty.toFixed(2)} sq.ft`}</p></div>
                                  <div><p className="text-[11px] text-muted-foreground">Rate</p><p>{formatCurrency(unitPrice)}</p></div>
                                </div>

                                {showWorkOrders && (
                                  <div className="border-t border-border pt-3 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Production</span>
                                      {item.work_order_no && <span className="font-mono text-xs text-muted-foreground">{item.work_order_no}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge className={`border-0 ${PRODUCTION_STATUS_STYLES[productionStatus] || PRODUCTION_STATUS_STYLES[1]}`}>
                                        {item.production_status_title || PRODUCTION_STATUSES.find((status) => status.value === productionStatus)?.label || "Pending"}
                                      </Badge>
                                      <Badge className={`border-0 ${PRIORITY_STYLES[priorityValue] || PRIORITY_STYLES[2]}`}>
                                        {item.priority_title || WORK_ORDER_PRIORITIES.find((priorityItem) => priorityItem.value === priorityValue)?.label || "Normal"} priority
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Assigned to: <span className="font-medium text-foreground">{assignedName || "Unassigned"}</span>
                                    </p>
                                    {(item.work_start_date || item.work_end_date) && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />Start: <span className="text-foreground">{formatWorkOrderDate(item.work_start_date)}</span></p>
                                        <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />End: <span className="text-foreground">{formatWorkOrderDate(item.work_end_date)}</span></p>
                                      </div>
                                    )}
                                    {!isInvoice && <Button
                                      type="button"
                                      variant="outline"
                                      className="quotation-interactive w-full h-10 rounded-lg gap-2"
                                      onClick={() => openWorkOrderDialog(item)}
                                    >
                                      <History className="h-4 w-4" />
                                      Update status & history
                                      <span className="ml-auto text-xs text-muted-foreground">{workHistoryCount}</span>
                                    </Button>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-end border-t border-border pt-3 text-sm">
                          <span className="text-muted-foreground mr-3">Room Total</span>
                          <span className="font-bold text-primary">{formatCurrency(roomTotal)}</span>
                        </div>

                        {/* Raw Materials Section */}
                        <div className="mt-4 space-y-4">
                          {items.map((item: any, idx: number) => {
                            const rawMaterials = item.raw_materials || [];
                            if (rawMaterials.length === 0) return null;

                            return (
                              <div key={`rm-${item.qp_id || idx}`} className="bg-secondary/10 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Raw Materials for: {item.product_name}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {rawMaterials.map((rm: any, rIdx: number) => (
                                    <Badge key={rIdx} variant="secondary" className="text-xs px-2 py-1 rounded-md">
                                      {rm.rm_name || rm.name || "Material"}
                                      {rm.required_qty && ` (${parseFloat(rm.required_qty).toFixed(2)} ${rm.unit || ''})`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No items found</p>
          )}
        </Card>

        {/* ─── SUMMARY ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 sm:p-6 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                {isInvoice ? "Invoice Details" : "Package Details"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{isInvoice ? "Invoice ID" : "Quotation ID"}</p>
                  <p className="font-mono font-medium break-all">{quotation.quotation_number || "—"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{isInvoice ? "Invoice Date" : "Created"}</p>
                  <p className="font-medium">{isInvoice ? documentDate(latestInvoiceHistory) : formatDate(quotation.c_date)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{isInvoice ? "Generated By" : "Created By"}</p>
                  <p className="font-medium break-words">{isInvoice ? latestInvoiceHistory?.emp_name || quotation.generated_by_name || "—" : quotation.generated_by_name || "—"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Package Name</p>
                  <p className="font-medium break-words">{q.package_name || q.package_details || "—"}</p>
                </div>
              </div>
            </Card>

            {/* Special Instructions */}
            {quotation.remark && (
              <Card className="p-6 bg-card border-border shadow-soft rounded-2xl">
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Special Instructions
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.remark}</p>
              </Card>
            )}

            {/* Terms & Conditions */}
            <Card className="p-6 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Terms & Conditions
              </h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. All prices are in Indian Rupees (₹).</p>
                <p>2. Payment terms: 50% advance, 50% before delivery.</p>
                <p>3. Delivery timeline: Subject to material availability.</p>
                <p>4. Any additional work will be charged extra.</p>
                <p>5. {isInvoice ? "This invoice reflects the products and amounts billed for this project." : "This quotation is valid for 15 days from the date of issue."}</p>
              </div>
            </Card>
          </div>

          {/* Status History Sidebar */}
          <div className="space-y-6">
            <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {isInvoice ? "Invoice & Status History" : "Status History"}
              </h3>
              {statusHistory.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {statusHistory.map((history, index) => {
                    const Icon = STATUS_ICONS[history.status] || Clock;
                    return (
                      <div key={index} className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0">
                        <div className={`mt-0.5 p-1 rounded-full ${STATUS_COLORS[history.status] || 'bg-gray-100'}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{history.status}</p>
                          {history.remark && <p className="text-xs text-muted-foreground">{history.remark}</p>}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {history.emp_name || "—"} · {history.c_date ? formatDate(history.c_date) : "—"}
                            {history.c_time && ` ${history.c_time}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No status history</p>
              )}
            </Card>
          </div>
        </div>

        {showWorkOrders && (
          <Card className="quotation-work-order-page p-5 sm:p-6 bg-card border-border shadow-soft rounded-2xl">
            <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Product-wise Work Order Status
            </h3>
            <div className="space-y-5">
              {(q.rooms || []).map((room: any, roomIndex: number) => {
                const products = room.items || [];
                if (!products.length) return null;
                return (
                  <section key={room.qr_id || roomIndex} className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">{room.room_name || `Room ${roomIndex + 1}`}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {products.map((product: any, productIndex: number) => {
                        const statusValue = Number(product.production_status || 1);
                        const history = product.latest_work_status || product.latest_history || null;
                        const imageUrl = getWorkOrderImageUrl(history?.image);
                        return (
                          <article key={product.qp_id || productIndex} className="min-w-0 rounded-xl border border-border p-4 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">{room.room_name || `Room ${roomIndex + 1}`}</p>
                                <h5 className="font-semibold break-words">{product.product_name || `Product ${productIndex + 1}`}</h5>
                              </div>
                              <Badge className={`border-0 ${PRODUCTION_STATUS_STYLES[statusValue] || PRODUCTION_STATUS_STYLES[1]}`}>
                                {product.production_status_title || PRODUCTION_STATUSES.find((status) => status.value === statusValue)?.label || "Pending"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                              {history?.remark || "No work remark added."}
                            </p>
                            {imageUrl && (
                              <a href={imageUrl} target="_blank" rel="noreferrer" className="block">
                                <img src={imageUrl} alt={`Work update for ${product.product_name || "product"}`} className="w-full max-h-64 rounded-lg border border-border object-contain bg-muted/20" />
                              </a>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Per-product production status and history */}
      {!isInvoice && <Dialog open={workOrderDialogOpen} onOpenChange={setWorkOrderDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Product Work Order
            </DialogTitle>
            <DialogDescription className="break-words">
              {activeProduct?.product_name || "Product"}
              {activeProduct?.work_order_no ? ` · ${activeProduct.work_order_no}` : ""}
              {quotation?.quotation_number ? ` · ${quotation.quotation_number}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 py-2">
            <section className="space-y-4 min-w-0">
              <h4 className="text-sm font-semibold">Update production</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Production status</Label>
                  <Select value={productionStatus} onValueChange={setProductionStatus}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCTION_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={String(status.value)}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORK_ORDER_PRIORITIES.map((item) => (
                        <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Assign to employee</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Choose employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.filter((employee) => employee.emp_id).map((employee) => (
                        <SelectItem key={employee.emp_id} value={String(employee.emp_id)}>{employee.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="work-order-remark">Remark</Label>
                  <Textarea
                    id="work-order-remark"
                    value={workRemark}
                    onChange={(event) => setWorkRemark(event.target.value)}
                    placeholder="Add a production update or note"
                    rows={3}
                    className="rounded-lg resize-y"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="work-order-image">Attach image</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Input
                      id="work-order-image"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                      className="h-auto min-h-10 rounded-lg file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs"
                      onChange={(event) => setWorkImage(event.target.files?.[0] || null)}
                    />
                    {workImage && <span className="text-xs text-muted-foreground break-all">{workImage.name}</span>}
                  </div>
                </div>
              </div>
              <Button type="button" className="w-full rounded-lg" onClick={handleSaveWorkOrder} disabled={savingWorkOrder || !activeProduct}>
                {savingWorkOrder ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save update"}
              </Button>
            </section>

            <section className="min-w-0 space-y-3 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Status history</h4>
              </div>
              {loadingWorkOrderHistory ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : workOrderHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No production updates yet. Save the first status to start this product’s history.
                </div>
              ) : (
                <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                  {workOrderHistory.map((entry) => {
                    const statusValue = Number(entry.status);
                    const statusLabel = entry.status_title || PRODUCTION_STATUSES.find((item) => item.value === statusValue)?.label || "Production update";
                    const imageUrl = getWorkOrderImageUrl(entry.image);
                    return (
                      <article key={entry.history_id} className="rounded-xl border border-border p-3 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Badge className={`border-0 ${PRODUCTION_STATUS_STYLES[statusValue] || PRODUCTION_STATUS_STYLES[1]}`}>{statusLabel}</Badge>
                          <span className="text-[11px] text-muted-foreground">{formatWorkHistoryDate(entry)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.emp_name || "Team member"}</p>
                        {entry.remark && <p className="text-sm whitespace-pre-wrap break-words">{entry.remark}</p>}
                        {imageUrl && (
                          <a href={imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border">
                            <img src={imageUrl} alt={`Work update for ${activeProduct?.product_name || "product"}`} className="max-h-56 w-full object-cover" loading="lazy" />
                          </a>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>}

      {/* Status Update Dialog */}
      {!isInvoice && <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
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
                    <SelectItem key={status} value={status}>{status}</SelectItem>
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
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setStatusDialogOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button className="rounded-xl h-11 flex-1 sm:flex-none gap-2" onClick={handleUpdateStatus} disabled={updating || !selectedStatus}>
              {updating ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : selectedStatus === "Work In Progress" ? "Confirm & Update Status" : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </MainLayout>
  );
}
