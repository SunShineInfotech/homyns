// src/pages/Leads/MyLeads.tsx
import { useState, useEffect, useCallback } from "react";
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
import { toast } from "@/hooks/use-toast";
import { leadService, Lead } from "@/services/lead.service";
import { leadSourceService, LeadSource } from "@/services/lead-source.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import {
  Search,
  Loader2,
  Users,
  Phone,
  Mail,
  Eye,
  Pencil,
  Trash2,
  X,
  Building2,
  UserCheck,
  Filter,
  RefreshCw,
  Calendar,
  Plus,
  PhoneCall,
  UserPlus,
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

interface LeadStats {
  rowdata: number;
  communicating: number;
  interested: number;
  notinterested: number;
  demodone: number;
  billfinal: number;
  alllead: number;
}

export default function MyLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    rowdata: 0,
    communicating: 0,
    interested: 0,
    notinterested: 0,
    demodone: 0,
    billfinal: 0,
    alllead: 0,
  });

  // Make Customer Dialog
  const [makeCustomerDialog, setMakeCustomerDialog] = useState(false);
  const [customerTarget, setCustomerTarget] = useState<Lead | null>(null);
  const [converting, setConverting] = useState(false);

  // Filter states
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

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

  useEffect(() => {
    fetchSources();
    fetchStatuses();
  }, [fetchSources, fetchStatuses]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const empId = getEmployeeId();

      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        setLeads([]);
        return;
      }

      const res = await leadService.getLeads(companyId, 'my', empId);

      if (res.status === "success" && Array.isArray(res.data)) {
        // Filter by date range, source, and status
        let filteredData = res.data;

        if (fromDate && toDate) {
          filteredData = filteredData.filter(lead => {
            if (!lead.c_date) return false;
            const leadDate = lead.c_date.split('T')[0];
            return leadDate >= fromDate && leadDate <= toDate;
          });
        }

        if (filterSource) {
          filteredData = filteredData.filter(lead => lead.source_id === filterSource);
        }

        if (filterStatus) {
          filteredData = filteredData.filter(lead => lead.status === filterStatus);
        }

        setLeads(filteredData);
        calculateStats(filteredData);
      } else {
        setLeads([]);
        if (res.message) {
          toast({ title: "Error", description: res.message, variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error('MyLeads fetchLeads error:', e);
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, filterSource, filterStatus]);

  // Replace the calculateStats function with this dynamic version

  const calculateStats = (data: Lead[]) => {
    // Get all status IDs from the leads
    const statusCounts: Record<string, number> = {};
    data.forEach(lead => {
      const statusId = lead.status || 'unknown';
      statusCounts[statusId] = (statusCounts[statusId] || 0) + 1;
    });

    // Map status IDs to names using the statuses array
    const statsData: LeadStats = {
      rowdata: 0,
      communicating: 0,
      interested: 0,
      notinterested: 0,
      demodone: 0,
      billfinal: 0,
      alllead: data.length,
    };

    // Map each status ID to its count
    Object.entries(statusCounts).forEach(([statusId, count]) => {
      const status = statuses.find(s => s.status_id === statusId);
      const statusName = status?.status_name?.toLowerCase() || '';

      // Map status names to stats fields
      if (statusName.includes('row') || statusName.includes('new')) {
        statsData.rowdata = count;
      } else if (statusName.includes('communicating') || statusName.includes('contact')) {
        statsData.communicating = count;
      } else if (statusName.includes('interest')) {
        statsData.interested = count;
      } else if (statusName.includes('not interest') || statusName.includes('lost')) {
        statsData.notinterested = count;
      } else if (statusName.includes('demo')) {
        statsData.demodone = count;
      } else if (statusName.includes('bill') || statusName.includes('final')) {
        statsData.billfinal = count;
      }
    });

    setStats(statsData);
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    let list = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.lead_name?.toLowerCase().includes(q) ||
          l.phone1?.includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.project_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [leads, search]);

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
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleMakeCustomer = async () => {
    if (!customerTarget?.lead_id) return;
    setConverting(true);
    try {
      const res = await leadService.convertToClient(customerTarget.lead_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Lead converted to customer successfully" });
        setMakeCustomerDialog(false);
        setCustomerTarget(null);
        await fetchLeads();
      } else {
        toast({ title: "Error", description: res.message || "Failed to convert to customer", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setConverting(false);
    }
  };

  const getStatusBadgeStyle = (statusId?: string) => {
    const status = statuses.find(s => s.status_id === statusId);
    return {
      backgroundColor: status?.background_color || '#6b7280',
      color: status?.font_color || '#ffffff',
    };
  };

  const getStatusLabel = (statusId?: string) => {
    const status = statuses.find(s => s.status_id === statusId);
    return status?.status_name || statusId || 'Unknown';
  };

  if (loading) {
    return (
      <MainLayout title="My Leads" subtitle="Leads assigned to you">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Leads" subtitle="Leads assigned to you">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Stats Cards */}

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {statuses.map((status) => {
            const count = leads.filter(l => l.status === status.status_id).length;
            return (
              <Card
                key={status.status_id}
                className="p-3 rounded-xl border-2"
                style={{
                  backgroundColor: status.background_color || '#f3f4f6',
                  borderColor: status.background_color || '#e5e7eb',
                }}
              >
                <p className="text-xs font-medium" style={{ color: status.font_color || '#1f2937' }}>
                  {status.status_name}
                </p>
                <p className="text-2xl font-bold" style={{ color: status.font_color || '#1f2937' }}>
                  {count}
                </p>
              </Card>
            );
          })}
          {/* Always show total */}
          <Card className="p-3 rounded-xl bg-gray-50 border-gray-200">
            <p className="text-xs text-gray-700">Total</p>
            <p className="text-2xl font-bold text-gray-800">{leads.length}</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my leads..."
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Button
              variant="outline"
              className="h-10 rounded-xl gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
            </Badge>
            <Button onClick={() => navigate("/lead/form", { state: { from: "/my-leads" } })} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="p-4 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Source</Label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source.source_id} value={source.source_id || ""}>
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
                      <SelectItem key={status.status_id} value={status.status_id || ""}>
                        {status.status_name}
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
              <Button variant="outline" onClick={() => {
                setFilterSource("");
                setFilterStatus("");
                const date = new Date();
                date.setDate(date.getDate() - 14);
                setFromDate(date.toISOString().split('T')[0]);
                setToDate(new Date().toISOString().split('T')[0]);
              }} className="rounded-xl h-10">
                Clear
              </Button>
            </div>
          </Card>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No leads match your search" : "No leads assigned to you yet"}
            </p>
            {!search && (
              <Button onClick={() => navigate("/lead/form", { state: { from: "/my-leads" } })} variant="outline" size="sm" className="rounded-xl gap-1.5">
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Person Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mobile</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Alternate Mobile</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Area</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Light Bill</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Load</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((lead, idx) => {
                    const statusStyle = getStatusBadgeStyle(lead.status);
                    return (
                      <tr key={lead.lead_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs rounded-lg border-green-500 text-green-600 hover:bg-green-50"
                                onClick={() => navigate(`/followup/form?lead_id=${lead.lead_id}`)}
                              >
                                <PhoneCall className="h-3 w-3 mr-1" /> Add Followup
                              </Button>
                              {!lead.converted_client_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs rounded-lg border-blue-500 text-blue-600 hover:bg-blue-50"
                                  onClick={() => {
                                    setCustomerTarget(lead);
                                    setMakeCustomerDialog(true);
                                  }}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" /> Make Customer
                                </Button>
                              )}
                              {lead.converted_client_id && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  <UserCheck className="h-3 w-3 mr-1" /> Customer
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"
                                onClick={() => navigate(`/lead/view/${lead.lead_id}`)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                                onClick={() => navigate(`/lead/form/${lead.lead_id}`, { state: { from: "/my-leads" } })}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => { setDeleteTarget(lead); setDeleteConfirm(true); }}
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
                        <td className="px-4 py-3 font-medium">{lead.lead_name}</td>
                        <td className="px-4 py-3">{lead.person_name || "—"}</td>
                        <td className="px-4 py-3">{lead.phone1}</td>
                        <td className="px-4 py-3">{lead.phone2 || "—"}</td>
                        <td className="px-4 py-3">{lead.email || "—"}</td>
                        <td className="px-4 py-3">{lead.address || "—"}</td>
                        <td className="px-4 py-3">{lead.area_name || "—"}</td>
                        <td className="px-4 py-3">{lead.light_bill || "—"}</td>
                        <td className="px-4 py-3">{lead.light_load || "—"}</td>
                        <td className="px-4 py-3">{lead.c_date ? new Date(lead.c_date).toLocaleDateString() : "—"}</td>
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
                        <p className="font-semibold text-foreground">{lead.lead_name}</p>
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
                        <Badge variant="secondary" className="rounded-md text-xs px-2 py-0.5">{lead.source_name}</Badge>
                      )}
                      {lead.area_name && (
                        <Badge variant="outline" className="rounded-md text-xs px-2 py-0.5">{lead.area_name}</Badge>
                      )}
                      {lead.converted_client_id && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          <UserCheck className="h-3 w-3 mr-1" /> Customer
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {lead.c_date ? new Date(lead.c_date).toLocaleDateString() : ""}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-green-500 hover:text-green-600 hover:bg-green-50"
                          onClick={() => navigate(`/followup/form?lead_id=${lead.lead_id}`)}
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
                              setCustomerTarget(lead);
                              setMakeCustomerDialog(true);
                            }}
                            title="Make Customer"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                          onClick={() => navigate(`/lead/form/${lead.lead_id}`, { state: { from: "/my-leads" } })}
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
      <AlertDialog open={deleteConfirm} onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); } }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.lead_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Make Customer Confirmation Dialog */}
      <AlertDialog open={makeCustomerDialog} onOpenChange={(o) => { if (!o && !converting) { setMakeCustomerDialog(false); setCustomerTarget(null); } }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert <strong className="text-foreground">{customerTarget?.lead_name}</strong> to a customer?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                This will create a customer record and link it to this lead.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMakeCustomer} disabled={converting} className="bg-blue-600 text-white hover:bg-blue-700">
              {converting ? <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</> : "Yes, Convert to Customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}