// src/pages/QuotationHistory.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { quotationService, Quotation } from "@/services/quotation.service";
import {
  quotationStatusService,
  QUOTATION_STATUSES,
} from "@/services/quotation-status.service";
import { customerService, Customer } from "@/services/customer.service";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Eye,
  Pencil,
  Trash2,
  Loader2,
  FileDown,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
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

type SortKey =
  | "quotation_id"
  | "quotation_number"
  | "client_name"
  | "final_amount"
  | "status"
  | "c_date";
type SortDir = "asc" | "desc";

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

const INVOICE_PDF_STATUSES = new Set([
  "Invoice Generated",
  "Work In Progress",
  "Work Completed",
  "Work Stop Due To Payment",
  "Closed",
  "Rejected",
]);

const INDIA_TIME_ZONE = "Asia/Kolkata";

const getIndiaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

// Default filter = the current month (India time): 1st → last day of the month.
const getDefaultDateRange = () => {
  const [year, month] = getIndiaToday().split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0)); // day 0 of next month = last day of this month

  const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);
  return {
    start: toDateInputValue(startDate),
    end: toDateInputValue(endDate),
  };
};

const getIndiaDatePart = (dateTime?: string) => {
  if (!dateTime) return "";

  // PHP's `date('Y-m-d H:i:s')` value has no timezone suffix and is already
  // in Asia/Kolkata. Convert explicitly zoned API timestamps to India time.
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateTime)) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: INDIA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(dateTime));
    const values = Object.fromEntries(
      parts.map(({ type, value }) => [type, value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  }

  return dateTime.slice(0, 10);
};

/**
 * The quotation's own date (YYYY-MM-DD).
 * `quotation_date` exists only in tbl_quotation, so it can never be
 * overwritten by the joined client row (the old API returned the CLIENT's
 * c_date as the quotation's c_date). Falls back to c_date for old rows.
 */
const getQuotationDate = (quotation: Quotation): string => {
  const quotationDate = String(quotation.quotation_date || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(quotationDate))
    return quotationDate.slice(0, 10);
  return getIndiaDatePart(quotation.c_date);
};

export default function QuotationHistory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState<Quotation[]>([]);

  // Filters
  const [start, setStart] = useState(() => getDefaultDateRange().start);
  const [end, setEnd] = useState(() => getDefaultDateRange().end);
  const [customerId, setCustomerId] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") || "",
  );
  const [search, setSearch] = useState("");

  // Sort - Default: sort by quotation_id DESC (newest first)
  const [sortKey, setSortKey] = useState<SortKey>("quotation_id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
  }, [searchParams]);

  const updateStatusFilter = (status: string) => {
    setStatusFilter(status);
    const nextParams = new URLSearchParams(searchParams);
    if (status) {
      nextParams.set("status", status);
      nextParams.delete("view");
    } else {
      nextParams.delete("status");
      nextParams.set("view", "all");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
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
        return;
      }

      const [quotationsRes, customersRes] = await Promise.all([
        quotationService.getQuotations(companyId),
        customerService.getCustomers(companyId),
      ]);

      console.log("Quotations Response:", quotationsRes);

      if (quotationsRes.status === "success" && quotationsRes.data) {
        // Use the latest status-history row to correct stale quotation.status
        // values returned by the quotation list endpoint.
        const quotationsWithCurrentStatus = await Promise.all(
          quotationsRes.data.map(async (quotation) => {
            if (!quotation.quotation_id) return quotation;
            try {
              const historyRes = await quotationStatusService.getStatusHistory(
                quotation.quotation_id,
              );
              const history =
                historyRes.status === "success" &&
                Array.isArray(historyRes.data)
                  ? historyRes.data
                  : [];
              const currentStatus = history.length
                ? String(history[history.length - 1].status || "").trim()
                : quotation.status;
              return { ...quotation, status: currentStatus || "Pending" };
            } catch {
              return quotation;
            }
          }),
        );
        setQuotations(quotationsWithCurrentStatus);
        setFiltered(quotationsWithCurrentStatus);
      } else {
        toast({
          title: "Error",
          description: quotationsRes.message || "Failed to fetch quotations",
          variant: "destructive",
        });
      }

      if (customersRes.status === "success" && customersRes.data) {
        setCustomers(customersRes.data);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and sort
  useEffect(() => {
    if (quotations.length === 0) {
      console.log("No quotations to filter");
      return;
    }

    console.log("Filtering quotations:", quotations.length);
    let list = [...quotations];

    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.quotation_number?.toLowerCase().includes(q) ||
          item.client_name?.toLowerCase().includes(q) ||
          item.status?.toLowerCase().includes(q),
      );
    }

    // Apply date filters (on the quotation's own date)
    if (start) {
      list = list.filter((item) => getQuotationDate(item) >= start);
    }
    if (end) {
      list = list.filter((item) => getQuotationDate(item) <= end);
    }

    // Apply customer filter
    if (customerId) {
      list = list.filter((item) => item.client_id === customerId);
    }

    if (statusFilter) {
      list = list.filter(
        (item) => (item.status || "Pending").trim() === statusFilter,
      );
    }

    // Apply sorting
    list.sort((a, b) => {
      let va: any = "";
      let vb: any = "";

      if (sortKey === "quotation_id") {
        va = Number(a.quotation_id) || 0;
        vb = Number(b.quotation_id) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      } else if (sortKey === "quotation_number") {
        va = (a.quotation_number || "").toLowerCase();
        vb = (b.quotation_number || "").toLowerCase();
      } else if (sortKey === "client_name") {
        va = (a.client_name || "").toLowerCase();
        vb = (b.client_name || "").toLowerCase();
      } else if (sortKey === "final_amount") {
        va = Number(a.final_amount || 0);
        vb = Number(b.final_amount || 0);
        return sortDir === "asc" ? va - vb : vb - va;
      } else if (sortKey === "status") {
        va = (a.status || "").toLowerCase();
        vb = (b.status || "").toLowerCase();
      } else {
        // Date sort; same day → newer quotation id first/last with the date
        va = `${getQuotationDate(a)}#${String(Number(a.quotation_id) || 0).padStart(10, "0")}`;
        vb = `${getQuotationDate(b)}#${String(Number(b.quotation_id) || 0).padStart(10, "0")}`;
      }

      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    console.log("Filtered result:", list.length);
    setFiltered(list);
  }, [
    quotations,
    search,
    start,
    end,
    customerId,
    statusFilter,
    sortKey,
    sortDir,
  ]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col ? (
      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
    ) : sortDir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );

  const handleView = (id: string) => {
    navigate(`/quotation/view/${id}`);
  };

  const handleInvoice = (id: string) => {
    navigate(`/invoice/view/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/quotation/edit/${id}`);
  };

  const askDelete = (item: Quotation) => {
    setDeleteTarget(item);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.quotation_id) return;
    setDeleting(true);
    try {
      const res = await quotationService.deleteQuotation(
        deleteTarget.quotation_id,
      );
      if (res.status === "success") {
        toast({
          title: "Success",
          description: "Quotation deleted successfully",
        });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to delete",
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
      setDeleting(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.client_id || "",
    label: c.client_name || "",
  }));

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount || 0).toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const indiaDate = getIndiaDatePart(dateStr);
    return new Date(`${indiaDate}T00:00:00Z`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  if (loading) {
    return (
      <MainLayout
        title="Quotation History"
        subtitle="Browse, filter and manage quotations"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  console.log("Rendering with filtered:", filtered.length, "items");

  return (
    <MainLayout
      title="Quotation History"
      subtitle="Browse, filter and manage quotations"
    >
      <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
        {/* Filters */}
        <Card className="p-3 md:p-4 rounded-2xl border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3 items-end">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Search
              </Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by #, client, status..."
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Start Date
              </Label>
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                End Date
              </Label>
              <Input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-10 rounded-xl text-sm"
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Client
              </Label>
              <SearchableSelect
                options={customerOptions}
                value={customerId}
                onChange={setCustomerId}
                placeholder="All clients"
                clearable
              />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">
                Quotation Status
              </Label>
              <SearchableSelect
                options={[
                  { value: "", label: "All statuses" },
                  ...QUOTATION_STATUSES.map((status) => ({
                    value: status,
                    label: status,
                  })),
                ]}
                value={statusFilter}
                onChange={updateStatusFilter}
                placeholder="All statuses"
                searchPlaceholder="Search quotation status..."
              />
            </div>
            <Button
              variant="ghost"
              className="h-10 rounded-xl text-xs text-muted-foreground"
              onClick={() => {
                const dateRange = getDefaultDateRange();
                setStart(dateRange.start);
                setEnd(dateRange.end);
                setCustomerId("");
                updateStatusFilter("");
                setSearch("");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort("quotation_id")}
                >
                  <span className="flex items-center gap-1.5">
                    Id <SortIcon col="quotation_id" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort("quotation_number")}
                >
                  <span className="flex items-center gap-1.5">
                    Quotation # <SortIcon col="quotation_number" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort("client_name")}
                >
                  <span className="flex items-center gap-1.5">
                    Client <SortIcon col="client_name" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort("final_amount")}
                >
                  <span className="flex items-center justify-end gap-1.5">
                    Amount <SortIcon col="final_amount" />
                  </span>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort("status")}
                >
                  <span className="flex items-center gap-1.5">
                    Status <SortIcon col="status" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created By
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort("c_date")}
                >
                  <span className="flex items-center gap-1.5">
                    Date <SortIcon col="c_date" />
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered && filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr
                    key={item.quotation_id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      #{item.quotation_id}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {item.quotation_number}
                    </td>
                    <td className="px-4 py-3">{item.client_name}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(item.final_amount || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${STATUS_COLORS[item.status || "Pending"] || STATUS_COLORS["Pending"]} border`}
                      >
                        {item.status || "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.generated_by_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(getQuotationDate(item))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {INVOICE_PDF_STATUSES.has(item.status || "") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600"
                            onClick={() => handleInvoice(item.quotation_id!)}
                            title="Invoice PDF"
                            aria-label={`Open invoice PDF for ${item.quotation_number}`}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleView(item.quotation_id!)}
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                          onClick={() => handleEdit(item.quotation_id!)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => askDelete(item)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No quotations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered && filtered.length > 0 ? (
            filtered.map((item) => (
              <Card
                key={item.quotation_id}
                className="p-4 rounded-2xl border-border hover:shadow-soft transition-shadow"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-semibold text-foreground">
                        #{item.quotation_id}
                      </p>
                      <p className="font-mono text-sm text-muted-foreground">
                        {item.quotation_number}
                      </p>
                      <Badge
                        className={`${STATUS_COLORS[item.status || "Pending"] || STATUS_COLORS["Pending"]} border text-[10px]`}
                      >
                        {item.status || "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium mt-0.5">
                      {item.client_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created: {formatDate(getQuotationDate(item))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By: {item.generated_by_name || "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground text-lg">
                      {formatCurrency(item.final_amount || 0)}
                    </p>
                    <div className="flex gap-1 mt-2 justify-end">
                      {INVOICE_PDF_STATUSES.has(item.status || "") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600"
                          onClick={() => handleInvoice(item.quotation_id!)}
                          title="Invoice PDF"
                          aria-label={`Open invoice PDF for ${item.quotation_number}`}
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleView(item.quotation_id!)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => handleEdit(item.quotation_id!)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => askDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No quotations found
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {quotations.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {filtered.length} of {quotations.length} quotations
            </span>
            <span>
              Total:{" "}
              {formatCurrency(
                quotations.reduce((sum, q) => sum + (q.final_amount || 0), 0),
              )}
            </span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => {
          if (!o && !deleting) {
            setDeleteConfirm(false);
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deleteTarget?.quotation_number}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl h-11 flex-1 sm:flex-none mt-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="rounded-xl h-11 flex-1 sm:flex-none gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                "Yes, Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
