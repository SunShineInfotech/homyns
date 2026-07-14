// src/pages/Followups/AllFollowups.tsx
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
import { employeeService, Employee } from "@/services/employee.service";
import {
  Search,
  Loader2,
  Users,
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  Filter,
  RefreshCw,
  X,
  PhoneCall,
  Eye,
} from "lucide-react";

export default function AllFollowups() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filtered, setFiltered] = useState<Followup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");
  const [filterLeadId, setFilterLeadId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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

  const fetchLeads = useCallback(async () => {
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await leadService.getLeads(companyId, 'all');
      if (res.status === "success" && res.data) {
        setLeads(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch leads:", e);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchLeads();
  }, [fetchEmployees, fetchLeads]);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        return;
      }

      const filters: FollowupFilters = {};
      if (filterEmployeeId && filterEmployeeId !== "all") {
        filters.employee_id = filterEmployeeId;
      }
      if (filterLeadId && filterLeadId !== "all") {
        filters.lead_id = filterLeadId;
      }
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const res = await followupService.getFollowups(companyId, 'all', undefined, filters);
      if (res.status === "success" && res.data) {
        setFollowups(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch followups", variant: "destructive" });
        setFollowups([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, [filterEmployeeId, filterLeadId, startDate, endDate]);

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
          f.followup_by_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [followups, search]);

  const clearFilters = () => {
    setFilterEmployeeId("");
    setFilterLeadId("");
    setStartDate("");
    setEndDate("");
  };

  const getModeIcon = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'call': return <PhoneCall className="h-3 w-3" />;
      case 'whatsapp': return <MessageSquare className="h-3 w-3" />;
      case 'email': return <MessageSquare className="h-3 w-3" />;
      default: return <PhoneCall className="h-3 w-3" />;
    }
  };

  const getModeColor = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'call': return 'bg-blue-100 text-blue-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <MainLayout title="All Followups" subtitle="View all followups">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="All Followups" subtitle="Manage all followups">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search followups by lead, remark, employee..."
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              className="h-10 rounded-xl gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "followup" : "followups"}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="p-4 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Employee</Label>
                <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.emp_id} value={emp.emp_id || ""}>
                        {emp.name || emp.emp_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead</Label>
                <Select value={filterLeadId} onValueChange={setFilterLeadId}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="All Leads" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leads</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.lead_id} value={lead.lead_id || ""}>
                        {lead.lead_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
              <div>
                <Label>End Date</Label>
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
                Clear
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
              {search ? "No followups match your search" : "No followups added yet"}
            </p>
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Next Followup</th>
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
                      <td className="px-4 py-3">
                        {followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${getModeColor(followup.mode)}`}>
                          {getModeIcon(followup.mode)} {followup.mode || "Call"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{followup.followup_by_name || "—"}</td>
                      <td className="px-4 py-3">
                        {followup.next_followup_date ? (
                          <span className="text-amber-600 font-medium">
                            {new Date(followup.next_followup_date).toLocaleDateString()}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`);
                            }}
                            title="View Followup"
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
                  className="p-4 rounded-2xl hover:shadow-elevated transition-shadow cursor-pointer"
                  onClick={() => navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {followup.lead_name || "Unknown Lead"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {followup.remark}
                        </p>
                      </div>
                      <Badge className={`${getModeColor(followup.mode)} shrink-0 ml-2`}>
                        {getModeIcon(followup.mode)} {followup.mode || "Call"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : ""}
                      </span>
                      {followup.followup_by_name && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {followup.followup_by_name}
                        </span>
                      )}
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