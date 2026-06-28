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
  IndianRupee,
  Building2,
  ChevronDown,
  ChevronRight,
  Printer,
  Download,
  MapPin,
  CreditCard,
} from "lucide-react";

// ─── Helper Functions ──────────────────────────────────────────────────────
function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

  const convertHundreds = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertHundreds(n % 100) : '');
  };

  const convert = (n: number): string => {
    if (n === 0) return '';
    let words = '';
    let i = 0;
    while (n > 0) {
      if (n % 1000 !== 0) {
        words = convertHundreds(n % 1000) + ' ' + thousands[i] + ' ' + words;
      }
      n = Math.floor(n / 1000);
      i++;
    }
    return words.trim();
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = convert(rupees) + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' Paise';
  }
  return result.trim();
}

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  'Approved by Admin': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  'Sent to Customer': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
  'Approved by Customer': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  'Invoice Generated': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  'Work Started': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  'On Going': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  'Work Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  'Closed': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
  'Rejected': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

const STATUS_ICONS: Record<string, any> = {
  'Pending': Clock,
  'Approved by Admin': CheckCircle2,
  'Sent to Customer': CheckCircle2,
  'Approved by Customer': CheckCircle2,
  'Invoice Generated': FileText,
  'Work Started': CheckCircle2,
  'On Going': RefreshCw,
  'Work Completed': CheckCircle2,
  'Closed': CheckCircle2,
  'Rejected': AlertCircle,
};

export default function QuotationView() {
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

  // ─── Fetch Quotation Data via quotationService (same as Edit page) ──────
  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [quotationRes, historyRes] = await Promise.all([
        quotationService.getQuotation(id),
        quotationStatusService.getStatusHistory(id),
      ]);

      if (quotationRes.status === "success" && quotationRes.data) {
        const data: any = { ...quotationRes.data };

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

      if (historyRes.status === "success" && historyRes.data) {
        setStatusHistory(historyRes.data);
      }
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
        toast({ title: "Success", description: "Status updated successfully" });
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
      <MainLayout title="Quotation Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!quotation) {
    return (
      <MainLayout title="Quotation Details" subtitle="Not found">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Quotation not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/quotations")}>
            Back to List
          </Button>
        </div>
      </MainLayout>
    );
  }

  const q: any = quotation;
  const StatusIcon = STATUS_ICONS[q.status || 'Pending'] || Clock;

  // Client fields — same fallback pattern as the working Edit page
  const clientPhone =
    [q.phone, q.phone1, q.phone2, q.whatsapp_number].filter(Boolean).join(", ") || "—";
  const clientEmail = q.email || q.client_email || "—";
  const clientAddress = q.address || q.client_address || "—";
  const clientCity = q.city || q.client_city || "";
  const clientState = q.state || q.client_state || "";
  const clientGst = q.gst_number || q.client_gst || "";

  return (
    <MainLayout title={`Quotation ${quotation.quotation_number}`} subtitle="View quotation details">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="w-4 h-4" /> Back to List
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
            <Button onClick={() => setStatusDialogOpen(true)} className="gap-2 rounded-xl">
              <RefreshCw className="w-4 h-4" />
              Change Status
            </Button>
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

            {/* Quotation Details */}
            <div className="text-left md:text-right space-y-1">
              <div className="flex items-center md:justify-end gap-3">
                <h3 className="text-2xl font-display font-bold text-primary">{quotation.quotation_number}</h3>
                <Badge className={`${STATUS_COLORS[quotation.status || 'Pending']} border px-3 py-1`}>
                  <StatusIcon className="w-3 h-3 mr-1.5" />
                  {quotation.status || 'Pending'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Date: {quotation.c_date ? new Date(quotation.c_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                Created by: {quotation.generated_by_name || "—"}
              </p>
            </div>
          </div>
        </Card>

        {/* ─── CLIENT DETAILS ─────────────────────────────────────────────────── */}
        <Card className="p-6 bg-card border-border shadow-soft rounded-2xl">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Client Details
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
            Room-wise Items
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

                    {/* Items Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto p-4">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground min-w-[150px]">Item Name</th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Width</th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Height</th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Depth/Length</th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Qty</th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Per</th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Total Measure</th>
                              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Rate</th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {items.map((item: any, idx: number) => {
                              const qtyType = item.qty_type || 'Fixed';
                              const unit = getUnitLabel(qtyType);
                              const calculatedQty = parseFloat(item.calculated_qty) || 0;
                              const unitPrice = parseFloat(item.unit_price) || 0;
                              const totalPrice = parseFloat(item.total_price) || 0;
                              const width = parseFloat(item.width) || 0;
                              const height = parseFloat(item.height) || 0;
                              const depth = parseFloat(item.depth) || 0;
                              const length = parseFloat(item.length) || 0;

                              return (
                                <tr key={item.qp_id || idx} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                                  <td className="px-3 py-2 font-medium">
                                    {item.product_name}
                                    {item.is_special === "1" && (
                                      <Badge variant="secondary" className="ml-2 text-[9px] bg-amber-500/10 text-amber-600">
                                        Special
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">{width || '-'}</td>
                                  <td className="px-3 py-2 text-center">{height || '-'}</td>
                                  <td className="px-3 py-2 text-center">
                                    {qtyType === 'ByHWD' ? depth : qtyType === 'ByHWL' ? length : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center">{item.qty || 1}</td>
                                  <td className="px-3 py-2 text-center text-xs">{unit}</td>
                                  <td className="px-3 py-2 text-center">
                                    {qtyType === 'Fixed' ? (item.qty || 1) : calculatedQty.toFixed(2)}
                                    {qtyType !== 'Fixed' && ' sq.ft'}
                                  </td>
                                  <td className="px-3 py-2 text-center">{formatCurrency(unitPrice)}</td>
                                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(totalPrice)}</td>
                                </tr>
                              );
                            })}
                            {/* Room Total */}
                            <tr className="bg-muted/20">
                              <td colSpan={9} className="px-3 py-2 text-right font-semibold">
                                Room Total
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-primary">
                                {formatCurrency(roomTotal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>

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
                <p>5. This quotation is valid for 15 days from the date of issue.</p>
              </div>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-card border-border shadow-soft rounded-2xl sticky top-24">
              <h3 className="font-semibold text-foreground text-lg mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />
                Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(quotation.subtotal || 0)}</span>
                </div>
                {(quotation.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-destructive">- {formatCurrency(quotation.discount_amount || 0)}</span>
                  </div>
                )}
                {(quotation.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After Discount</span>
                    <span className="font-medium">{formatCurrency(q.amount_after_discount || 0)}</span>
                  </div>
                )}
                {(quotation.gst_percent || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST ({quotation.gst_percent}%)</span>
                    <span className="font-medium">{formatCurrency(quotation.gst_amount || 0)}</span>
                  </div>
                )}
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(quotation.final_amount || 0)}</span>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount in Words</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {numberToWords(quotation.final_amount || 0)}
                </p>
              </div>

              {/* Quick Info */}
              <div className="mt-4 pt-4 border-t border-border space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Quotation ID</span>
                  <span className="font-mono">{quotation.quotation_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{formatDate(quotation.c_date)}</span>
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
                    <SelectItem key={status} value={status}>{status}</SelectItem>
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
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setStatusDialogOpen(false)} disabled={updating}>
              Cancel
            </Button>
            <Button className="rounded-xl h-11 flex-1 sm:flex-none gap-2" onClick={handleUpdateStatus} disabled={updating || !selectedStatus}>
              {updating ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}