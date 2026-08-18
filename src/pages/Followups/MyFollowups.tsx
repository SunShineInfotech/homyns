// src/pages/Followups/MyFollowups.tsx
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
import { followupService, Followup, FollowupFilters } from "@/services/followup.service";
import { leadService, Lead } from "@/services/lead.service";
import { leadSourceService, LeadSource } from "@/services/lead-source.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import {
  Search,
  Loader2,
  Users,
  Calendar,
  Clock,
  Eye,
  User,
  X,
  PhoneCall,
  MessageSquare,
  Plus,
  Filter,
  RefreshCw,
  Phone,
} from "lucide-react";

export default function MyFollowups() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filtered, setFiltered] = useState<Followup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [filterLeadId, setFilterLeadId] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [leadSearch, setLeadSearch] = useState<string>("");
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);

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

  const fetchLeads = useCallback(async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await leadService.getLeads(companyId, 'all');
      if (res.status === "success" && res.data) {
        setLeads(res.data);
        // Extract unique sources and statuses for filters
        const uniqueSources = new Map();
        const uniqueStatuses = new Map();
        res.data.forEach((lead: Lead) => {
          if (lead.source_id && lead.source_name) {
            uniqueSources.set(lead.source_id, { source_id: lead.source_id, source_name: lead.source_name });
          }
          if (lead.status && lead.status_name) {
            uniqueStatuses.set(lead.status, { status_id: lead.status, status_name: lead.status_name });
          }
        });
        setSources(Array.from(uniqueSources.values()));
        setStatuses(Array.from(uniqueStatuses.values()));
      }
    } catch (e) {
      console.error("Failed to fetch leads:", e);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const empId = getEmployeeId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        setFollowups([]);
        return;
      }

      const filters: FollowupFilters = {};
      if (filterLeadId && filterLeadId !== "all") {
        filters.lead_id = filterLeadId;
      }
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const res = await followupService.getFollowups(companyId, 'my', empId, filters);
      console.log('MyFollowups fetchFollowups response:', res);
      
      if (res.status === "success" && Array.isArray(res.data)) {
        let data = res.data;
        // Apply source and status filters (these come from lead data)
        if (filterSource && filterSource !== "all") {
          data = data.filter(f => {
            const lead = leads.find(l => l.lead_id === f.lead_id);
            return lead?.source_id === filterSource;
          });
        }
        if (filterStatus && filterStatus !== "all") {
          data = data.filter(f => {
            const lead = leads.find(l => l.lead_id === f.lead_id);
            return lead?.status === filterStatus;
          });
        }
        setFollowups(data);
      } else {
        setFollowups([]);
        if (res.message) {
          toast({ title: "Error", description: res.message, variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error('MyFollowups fetchFollowups error:', e);
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, [filterLeadId, filterSource, filterStatus, startDate, endDate, leads]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  useEffect(() => {
    let list = [...followups];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.lead_name?.toLowerCase().includes(q) ||
          f.remark?.toLowerCase().includes(q) ||
          f.lead_phone?.includes(q)
      );
    }
    setFiltered(list);
  }, [followups, search]);

  const clearFilters = () => {
    setFilterLeadId("");
    setFilterSource("");
    setFilterStatus("");
    setStartDate("");
    setEndDate("");
    setLeadSearch("");
  };

  const getModeColor = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'call': return 'bg-blue-100 text-blue-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      case 'meeting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeIcon = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'call': return <PhoneCall className="h-3 w-3" />;
      case 'whatsapp': return <MessageSquare className="h-3 w-3" />;
      case 'email': return <MessageSquare className="h-3 w-3" />;
      case 'meeting': return <Users className="h-3 w-3" />;
      default: return <PhoneCall className="h-3 w-3" />;
    }
  };

  // Filter leads by search term for dropdown
  const filteredLeads = leadSearch.trim() 
    ? leads.filter(l => 
        l.lead_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.phone1?.includes(leadSearch)
      )
    : leads;

  if (loading) {
    return (
      <MainLayout title="My Followups" subtitle="Followups added by you">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Followups" subtitle="Followups added by you">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my followups by lead, remark, phone..."
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
              {(filterLeadId || filterSource || filterStatus || startDate || endDate) && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">Active</Badge>
              )}
            </Button>
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "followup" : "followups"}
            </Badge>
            <Button 
              onClick={() => navigate("/followup/form")} 
              className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Followup
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
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
                      <SelectItem key={source.source_id} value={source.source_id}>
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
                      <SelectItem key={status.status_id} value={status.status_id}>
                        {status.status_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Customer</Label>
                <div className="relative">
                  <Input
                    value={leadSearch}
                    onChange={(e) => {
                      setLeadSearch(e.target.value);
                      setLeadDropdownOpen(true);
                    }}
                    onFocus={() => setLeadDropdownOpen(true)}
                    placeholder="Search by name or number..."
                    className="h-10 rounded-xl"
                  />
                  {leadDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-auto">
                      {filteredLeads.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No leads found</div>
                      ) : (
                        filteredLeads.map((lead) => (
                          <div
                            key={lead.lead_id}
                            className={`p-2 hover:bg-muted cursor-pointer flex items-center justify-between ${filterLeadId === lead.lead_id ? 'bg-muted' : ''}`}
                            onClick={() => {
                              setFilterLeadId(lead.lead_id || "");
                              setLeadSearch(lead.lead_name || "");
                              setLeadDropdownOpen(false);
                            }}
                          >
                            <span>{lead.lead_name}</span>
                            <span className="text-xs text-muted-foreground">{lead.phone1}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={fetchFollowups} className="rounded-xl gap-2 h-10">
                <RefreshCw className="h-4 w-4" /> Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters} className="rounded-xl h-10">
                Clear All
              </Button>
            </div>
          </Card>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No followups match your search" : "You haven't added any followups yet"}
            </p>
            {!search && (
              <Button 
                onClick={() => navigate("/followup/form")} 
                variant="outline" 
                size="sm" 
                className="rounded-xl gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add your first followup
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Next Followup</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Remark</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((followup, idx) => (
                    <tr 
                      key={followup.followup_id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer" 
                      onClick={() => navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{followup.lead_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{followup.lead_phone || "—"}</td>
                      <td className="px-4 py-3">
                        {followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getModeColor(followup.mode)}>
                          {getModeIcon(followup.mode)} {followup.mode || "Call"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {followup.next_followup_date ? (
                          <span className="text-amber-600 font-medium">
                            {new Date(followup.next_followup_date).toLocaleDateString()}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="truncate" title={followup.remark}>
                          {followup.remark || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                            onClick={(e) => { e.stopPropagation(); navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filtered.map((followup) => (
                <Card 
                  key={followup.followup_id} 
                  className="p-4 rounded-2xl cursor-pointer" 
                  onClick={() => navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{followup.lead_name || "Unknown Lead"}</p>
                        {followup.lead_phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {followup.lead_phone}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          <span className="font-medium">Remark:</span> {followup.remark || "—"}
                        </p>
                      </div>
                      <Badge className={getModeColor(followup.mode)}>
                        {getModeIcon(followup.mode)} {followup.mode || "Call"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : ""}
                      </span>
                      {followup.next_followup_date && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="h-3 w-3" />
                          Next: {new Date(followup.next_followup_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {followup.status_update && (
                      <div className="pt-2 border-t border-border">
                        <Badge variant="secondary" className="text-xs">
                          Status: {followup.status_update}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}