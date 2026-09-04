// src/pages/Leads/AllLeads.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { leadService, Lead } from "@/services/lead.service";
import { leadSourceService, LeadSource } from "@/services/lead-source.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import { employeeService, Employee } from "@/services/employee.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Phone,
  Mail,
  MapPin,
  X,
  Eye,
  UserCheck,
  Building2,
  Filter,
  RefreshCw,
  Calendar,
  PhoneCall,
  UserPlus,
  User,
} from "lucide-react";

export default function AllLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<Lead[]>(
    [],
  );
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [convertConfirm, setConvertConfirm] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterEmployee, setFilterEmployee] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  // Track if customer search is active
  const [isCustomerSearchActive, setIsCustomerSearchActive] = useState(false);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
    return "";
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target as Node)
      ) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await leadSourceService.getLeadSources(companyId);
      if (res.status === "success" && res.data) {
        setSources(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch sources:", e);
    }
  }, []);

  const fetchStatuses = useCallback(async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await leadStatusService.getLeadStatuses(companyId);
      if (res.status === "success" && res.data) {
        setStatuses(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch statuses:", e);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await employeeService.getEmployees(companyId);
      if (res.status === "success" && res.data) {
        setEmployees(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch employees:", e);
    }
  }, []);

  useEffect(() => {
    fetchSources();
    fetchStatuses();
    fetchEmployees();
  }, [fetchSources, fetchStatuses, fetchEmployees]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        toast({
          title: "Error",
          description: "Company not found",
          variant: "destructive",
        });
        setLeads([]);
        return;
      }

      // Build filters - if customer search is active, don't apply date filters
      const filters: any = {};
      if (filterSource && filterSource !== "all") {
        filters.source_id = filterSource;
      }
      if (filterStatus && filterStatus !== "all") {
        filters.status = filterStatus;
      }
      if (filterEmployee && filterEmployee !== "all") {
        filters.assigned_to = filterEmployee;
      }
      // Only apply date filters if customer search is NOT active
      if (!isCustomerSearchActive) {
        if (fromDate) filters.start_date = fromDate;
        if (toDate) filters.end_date = toDate;
      }

      const res = await leadService.getLeads(
        companyId,
        "all",
        undefined,
        filters,
      );

      if (res.status === "success" && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setLeads([]);
        if (res.message) {
          toast({
            title: "Error",
            description: res.message,
            variant: "destructive",
          });
        }
      }
    } catch (e: any) {
      console.error("AllLeads fetchLeads error:", e);
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [
    filterSource,
    filterStatus,
    filterEmployee,
    fromDate,
    toDate,
    isCustomerSearchActive,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Customer search handler
  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    setIsCustomerSearchActive(true);
    setCustomerDropdownOpen(true);

    if (value.trim().length > 0) {
      const q = value.toLowerCase().trim();
      const results = leads.filter(
        (l) =>
          l.lead_name?.toLowerCase().includes(q) ||
          l.person_name?.toLowerCase().includes(q) ||
          l.phone1?.includes(q) ||
          l.phone2?.includes(q) ||
          l.email?.toLowerCase().includes(q),
      );
      setCustomerSearchResults(results);
      // Apply customer search filter to displayed leads
      setFiltered(results);
    } else {
      setCustomerSearchResults([]);
      setIsCustomerSearchActive(false);
      // Reset to regular filtering
      applyRegularFilter();
    }
  };

  // Regular search/filter handler
  const applyRegularFilter = () => {
    let list = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.lead_name?.toLowerCase().includes(q) ||
          l.phone1?.includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.project_name?.toLowerCase().includes(q) ||
          l.person_name?.toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  };

  // Select customer from dropdown
  const selectCustomer = (lead: Lead) => {
    setCustomerSearch(lead.lead_name || lead.person_name || "");
    setIsCustomerSearchActive(true);
    setCustomerDropdownOpen(false);
    setFiltered([lead]);
  };

  // Clear customer search
  const clearCustomerSearch = () => {
    setCustomerSearch("");
    setIsCustomerSearchActive(false);
    setCustomerSearchResults([]);
    setCustomerDropdownOpen(false);
    applyRegularFilter();
    // Refetch with date filters
    fetchLeads();
  };

  useEffect(() => {
    if (!isCustomerSearchActive) {
      applyRegularFilter();
    }
  }, [leads, search, isCustomerSearchActive]);

  const handleConvertToClient = async () => {
    if (!convertTarget?.lead_id) return;
    setConverting(true);
    try {
      const res = await leadService.convertToClient(convertTarget.lead_id);
      if (res.status === "success") {
        toast({
          title: "Success",
          description: "Lead converted to client successfully",
        });
        setConvertConfirm(false);
        setConvertTarget(null);
        await fetchLeads();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to convert",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.lead_id) return;
    setDeleting(true);
    try {
      const res = await leadService.deleteLead(deleteTarget.lead_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Lead deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchLeads();
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
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setFilterSource("");
    setFilterStatus("");
    setFilterEmployee("");
    const date = new Date();
    date.setDate(date.getDate() - 14);
    setFromDate(date.toISOString().split("T")[0]);
    setToDate(new Date().toISOString().split("T")[0]);
    clearCustomerSearch();
  };

  const getStatusBadgeStyle = (statusId?: string) => {
    const status = statuses.find((s) => s.status_id === statusId);
    return {
      backgroundColor: status?.background_color || "#6b7280",
      color: status?.font_color || "#ffffff",
    };
  };

  const getStatusLabel = (statusId?: string) => {
    const status = statuses.find((s) => s.status_id === statusId);
    return status?.status_name || statusId || "Unknown";
  };

  if (loading) {
    return (
      <MainLayout title="All Leads" subtitle="Manage all leads">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="All Leads" subtitle="Manage all leads">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Customer Search Bar - Prominent Direct Search */}
        {/* <div className="relative" ref={customerSearchRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                onFocus={() => {
                  if (customerSearch.trim().length > 0) {
                    setCustomerDropdownOpen(true);
                  }
                }}
                placeholder="🔍 Search customers by name, phone, or email..."
                className="pl-9 h-12 rounded-xl text-base border-2 border-primary/20 focus-visible:ring-primary/30"
              />
              {customerSearch && (
                <button
                  onClick={clearCustomerSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {isCustomerSearchActive && (
              <Button
                variant="outline"
                onClick={clearCustomerSearch}
                className="h-12 rounded-xl shrink-0"
              >
                Clear Search
              </Button>
            )}
          </div> */}

        {/* Customer Dropdown Results */}
        {/* {customerDropdownOpen && customerSearch.trim().length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-80 overflow-auto">
              {customerSearchResults.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No customers found matching "{customerSearch}"
                </div>
              ) : (
                customerSearchResults.map((lead) => (
                  <div
                    key={lead.lead_id}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 flex items-center justify-between"
                    onClick={() => selectCustomer(lead)}
                  >
                    <div>
                      <p className="font-medium">
                        {lead.lead_name || lead.person_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone1}
                        </span>
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {lead.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </div> */}

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter leads by name, phone, email, project..."
              className="pl-9 h-10 rounded-xl"
              disabled={isCustomerSearchActive}
            />
            {search && !isCustomerSearchActive && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              className="h-10 rounded-xl gap-2"
              onClick={() => setShowFilters(!showFilters)}
              disabled={isCustomerSearchActive}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filterSource ||
                filterStatus ||
                filterEmployee ||
                fromDate ||
                toDate) &&
                !isCustomerSearchActive && (
                  <Badge
                    variant="secondary"
                    className="ml-1 px-1.5 py-0.5 text-xs"
                  >
                    Active
                  </Badge>
                )}
            </Button>
            <Badge
              variant="secondary"
              className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
            </Badge>
            <Button
              onClick={() => navigate("/lead/form")}
              className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          </div>
        </div>

        {/* Filters - Disabled when customer search is active */}
        {showFilters && !isCustomerSearchActive && (
          <Card className="p-4 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label>Source</Label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sources.map((source) => (
                      <SelectItem
                        key={source.source_id}
                        value={source.source_id || ""}
                      >
                        {source.source_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem
                        key={status.status_id}
                        value={status.status_id || ""}
                      >
                        {status.status_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned To</Label>
                <Select
                  value={filterEmployee}
                  onValueChange={setFilterEmployee}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.emp_id} value={emp.emp_id || ""}>
                        {emp.name || ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={fetchLeads} className="rounded-xl gap-2 h-10">
                <RefreshCw className="h-4 w-4" /> Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="rounded-xl h-10"
              >
                Clear All
              </Button>
            </div>
          </Card>
        )}

        {/* Show message when customer search is active */}
        {isCustomerSearchActive && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Showing results for: <strong>"{customerSearch}"</strong>
            <span className="text-muted-foreground ml-2">
              ({filtered.length} results found)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCustomerSearch}
              className="ml-auto h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" /> Clear Search
            </Button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {isCustomerSearchActive
                ? `No customers found matching "${customerSearch}"`
                : search
                  ? "No leads match your search"
                  : "No leads added yet"}
            </p>
            {!search && !isCustomerSearchActive && (
              <Button
                onClick={() => navigate("/lead/form")}
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add your first lead
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">
                      #
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Actions
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Person
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Mobile
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((lead, idx) => {
                    const statusStyle = getStatusBadgeStyle(lead.status);
                    return (
                      <tr
                        key={lead.lead_id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs rounded-lg border-green-500 text-green-600 hover:bg-green-50"
                                onClick={() =>
                                  navigate(
                                    `/followup/form?lead_id=${lead.lead_id}`,
                                  )
                                }
                              >
                                <PhoneCall className="h-3 w-3 mr-1" /> Followup
                              </Button>
                              {!lead.converted_client_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs rounded-lg border-blue-500 text-blue-600 hover:bg-blue-50"
                                  onClick={() => {
                                    setConvertTarget(lead);
                                    setConvertConfirm(true);
                                  }}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" /> Convert
                                </Button>
                              )}
                              {lead.converted_client_id && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 text-xs"
                                >
                                  <UserCheck className="h-3 w-3 mr-1" />{" "}
                                  Customer
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                onClick={() =>
                                  navigate(`/lead/view/${lead.lead_id}`)
                                }
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                                onClick={() =>
                                  navigate(`/lead/form/${lead.lead_id}`)
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setDeleteTarget(lead);
                                  setDeleteConfirm(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className="rounded-md px-2.5 py-1 text-xs font-medium border-0"
                            style={statusStyle}
                          >
                            {getStatusLabel(lead.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{lead.source_name || "—"}</td>
                        <td className="px-4 py-3 font-medium">
                          {lead.lead_name}
                        </td>
                        <td className="px-4 py-3">{lead.person_name || "—"}</td>
                        <td className="px-4 py-3">{lead.phone1}</td>
                        <td className="px-4 py-3">{lead.email || "—"}</td>
                        <td className="px-4 py-3">
                          {lead.assigned_emp_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {lead.c_date
                            ? new Date(lead.c_date).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filtered.map((lead) => {
                const statusStyle = getStatusBadgeStyle(lead.status);
                return (
                  <Card key={lead.lead_id} className="p-4 rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {lead.lead_name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone1}
                        </p>
                        {lead.email && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" /> {lead.email}
                          </p>
                        )}
                      </div>
                      <Badge
                        className="rounded-md px-2.5 py-1 text-xs font-medium border-0"
                        style={statusStyle}
                      >
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {lead.source_name && (
                        <Badge
                          variant="secondary"
                          className="rounded-md text-xs px-2 py-0.5"
                        >
                          {lead.source_name}
                        </Badge>
                      )}
                      {lead.area_name && (
                        <Badge
                          variant="outline"
                          className="rounded-md text-xs px-2 py-0.5"
                        >
                          {lead.area_name}
                        </Badge>
                      )}
                      {lead.converted_client_id && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 text-xs"
                        >
                          <UserCheck className="h-3 w-3 mr-1" /> Customer
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {lead.assigned_emp_name || "Unassigned"}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-green-500 hover:text-green-600 hover:bg-green-50"
                          onClick={() =>
                            navigate(`/followup/form?lead_id=${lead.lead_id}`)
                          }
                          title="Add Followup"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </Button>
                        {!lead.converted_client_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                              setConvertTarget(lead);
                              setConvertConfirm(true);
                            }}
                            title="Convert to Customer"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() => navigate(`/lead/view/${lead.lead_id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                          onClick={() => navigate(`/lead/form/${lead.lead_id}`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
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
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deleteTarget?.lead_name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Client Confirmation Dialog */}
      <AlertDialog
        open={convertConfirm}
        onOpenChange={(o) => {
          if (!o && !converting) {
            setConvertConfirm(false);
            setConvertTarget(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert{" "}
              <strong className="text-foreground">
                {convertTarget?.lead_name}
              </strong>{" "}
              to a client?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                This will create a client record and link it to this lead. The
                lead will be marked as converted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToClient}
              disabled={converting}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {converting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Converting...
                </>
              ) : (
                "Yes, Convert to Client"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
