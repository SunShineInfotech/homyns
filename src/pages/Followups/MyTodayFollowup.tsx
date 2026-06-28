// src/pages/Followups/MyTodayFollowup.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { followupService, Followup } from "@/services/followup.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import {
  Loader2,
  PhoneCall,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Filter,
  Search,
  X,
  Eye,
  Trash2,
  Pencil,
  RefreshCw,
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Send,
  AlertCircle,
  MessageSquare,
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

const FOLLOWUP_MODES = [
  { value: "Call", label: "Call" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Email", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "Visit", label: "Visit" },
  { value: "Other", label: "Other" },
];

export default function MyTodayFollowup() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filteredFollowups, setFilteredFollowups] = useState<Followup[]>([]);
  const [groupedFollowups, setGroupedFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Date filter
  const [filterDate, setFilterDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Followup | null>(null);

  // Add Communication Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [nextFollowupError, setNextFollowupError] = useState("");
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [formData, setFormData] = useState({
    mode: "Call",
    remark: "",
    status_update: "",
    next_followup_date: "",
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

  const fetchStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await leadStatusService.getLeadStatuses(companyId);
      if (res.status === "success" && res.data) {
        setStatuses(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch statuses", e);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const empId = getEmployeeId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        return;
      }
      
      const res = await followupService.getFollowups(companyId, 'all', empId);
      
      if (res.status === "success" && res.data) {
        setFollowups(res.data);
        
        // Group by lead_id and get the latest next_followup_date for each lead
        const leadMap = new Map();
        res.data.forEach((f: Followup) => {
          if (!f.lead_id) return;
          
          // Only include if next_followup_date matches the filter date
          if (f.next_followup_date) {
            const nextDate = new Date(f.next_followup_date);
            const selectedDate = new Date(filterDate);
            nextDate.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            
            if (nextDate.getTime() !== selectedDate.getTime()) return;
          } else {
            return;
          }
          
          if (!leadMap.has(f.lead_id)) {
            leadMap.set(f.lead_id, {
              lead_id: f.lead_id,
              lead_name: f.lead_name || 'Unknown',
              lead_phone: f.lead_phone || '',
              followups: [],
              latest_next_followup_date: f.next_followup_date,
              total_count: 0,
              latest_followup: f
            });
          }
          
          const leadData = leadMap.get(f.lead_id);
          leadData.followups.push(f);
          leadData.total_count = leadData.followups.length;
          
          // Update latest next_followup_date if this one is newer
          if (f.next_followup_date && f.next_followup_date > leadData.latest_next_followup_date) {
            leadData.latest_next_followup_date = f.next_followup_date;
            leadData.latest_followup = f;
          }
        });
        
        // Convert map to array and sort by latest date
        const grouped = Array.from(leadMap.values())
          .sort((a, b) => {
            if (!a.latest_next_followup_date) return 1;
            if (!b.latest_next_followup_date) return -1;
            return new Date(b.latest_next_followup_date).getTime() - new Date(a.latest_next_followup_date).getTime();
          });
        
        setGroupedFollowups(grouped);
        setFilteredFollowups(res.data);
        
        // DON'T auto expand - keep all groups collapsed by default
        // setExpandedGroups(new Set()); // Already empty by default
      } else {
        setFollowups([]);
        setFilteredFollowups([]);
        setGroupedFollowups([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setFollowups([]);
      setFilteredFollowups([]);
      setGroupedFollowups([]);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchFollowups();
    fetchStatuses();
  }, [fetchFollowups]);

  // Search filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Reset to grouped data
      const leadMap = new Map();
      followups.forEach((f: Followup) => {
        if (!f.lead_id) return;
        if (!f.next_followup_date) return;
        
        const nextDate = new Date(f.next_followup_date);
        const selectedDate = new Date(filterDate);
        nextDate.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (nextDate.getTime() !== selectedDate.getTime()) return;
        
        if (!leadMap.has(f.lead_id)) {
          leadMap.set(f.lead_id, {
            lead_id: f.lead_id,
            lead_name: f.lead_name || 'Unknown',
            lead_phone: f.lead_phone || '',
            followups: [],
            latest_next_followup_date: f.next_followup_date,
            total_count: 0,
            latest_followup: f
          });
        }
        
        const leadData = leadMap.get(f.lead_id);
        leadData.followups.push(f);
        leadData.total_count = leadData.followups.length;
        
        if (f.next_followup_date && f.next_followup_date > leadData.latest_next_followup_date) {
          leadData.latest_next_followup_date = f.next_followup_date;
          leadData.latest_followup = f;
        }
      });
      
      const grouped = Array.from(leadMap.values())
        .sort((a, b) => {
          if (!a.latest_next_followup_date) return 1;
          if (!b.latest_next_followup_date) return -1;
          return new Date(b.latest_next_followup_date).getTime() - new Date(a.latest_next_followup_date).getTime();
        });
      
      setGroupedFollowups(grouped);
      return;
    }

    const term = searchTerm.toLowerCase();
    
    // Filter grouped followups
    const leadMap = new Map();
    followups.forEach((f: Followup) => {
      if (!f.lead_id) return;
      if (!f.next_followup_date) return;
      
      const nextDate = new Date(f.next_followup_date);
      const selectedDate = new Date(filterDate);
      nextDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (nextDate.getTime() !== selectedDate.getTime()) return;
      
      // Check if lead matches search
      const leadName = f.lead_name?.toLowerCase() || '';
      const leadPhone = f.lead_phone || '';
      const remark = f.remark?.toLowerCase() || '';
      
      if (!leadName.includes(term) && !leadPhone.includes(term) && !remark.includes(term)) {
        return;
      }
      
      if (!leadMap.has(f.lead_id)) {
        leadMap.set(f.lead_id, {
          lead_id: f.lead_id,
          lead_name: f.lead_name || 'Unknown',
          lead_phone: f.lead_phone || '',
          followups: [],
          latest_next_followup_date: f.next_followup_date,
          total_count: 0,
          latest_followup: f
        });
      }
      
      const leadData = leadMap.get(f.lead_id);
      leadData.followups.push(f);
      leadData.total_count = leadData.followups.length;
      
      if (f.next_followup_date && f.next_followup_date > leadData.latest_next_followup_date) {
        leadData.latest_next_followup_date = f.next_followup_date;
        leadData.latest_followup = f;
      }
    });
    
    const grouped = Array.from(leadMap.values())
      .sort((a, b) => {
        if (!a.latest_next_followup_date) return 1;
        if (!b.latest_next_followup_date) return -1;
        return new Date(b.latest_next_followup_date).getTime() - new Date(a.latest_next_followup_date).getTime();
      });
    
    setGroupedFollowups(grouped);
  }, [searchTerm, followups, filterDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDate(e.target.value);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.followup_id) return;
    setDeleting(true);
    try {
      const res = await followupService.deleteFollowup(deleteTarget.followup_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Followup deleted successfully" });
        setDeleteDialog(false);
        setDeleteTarget(null);
        await fetchFollowups();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const toggleGroup = (leadId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  // Open Add Communication Dialog
  const openAddCommunication = (lead: any) => {
    setSelectedLead(lead);
    setFormData({
      mode: "Call",
      remark: "",
      status_update: "",
      next_followup_date: "",
    });
    setFormError("");
    setNextFollowupError("");
    setAddDialogOpen(true);
  };

  const handleNextFollowupDateChange = (value: string) => {
    setFormData(p => ({ ...p, next_followup_date: value }));
    setNextFollowupError("");
    
    if (value) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setNextFollowupError("Next followup date cannot be in the past");
      }
    }
  };

  const handleAddFollowup = async () => {
    if (!selectedLead) {
      toast({ title: "Error", description: "No lead selected", variant: "destructive" });
      return;
    }
    
    if (!formData.remark?.trim()) {
      setFormError("Remark is required");
      return;
    }
    if (!formData.status_update) {
      setFormError("Status update is required");
      return;
    }
    
    if (formData.next_followup_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.next_followup_date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setNextFollowupError("Next followup date cannot be in the past");
        return;
      }
    }

    setFormError("");
    setSaving(true);

    try {
      const companyId = getCompanyId();
      const empId = getEmployeeId();
      
      const payload = {
        company_id: companyId,
        lead_id: selectedLead.lead_id,
        followup_date: new Date().toISOString().split('T')[0],
        next_followup_date: formData.next_followup_date || "",
        followup_by: empId,
        mode: formData.mode || "Call",
        remark: formData.remark.trim(),
        status_update: formData.status_update,
      };

      const res = await followupService.addFollowup(payload);

      if (res.status === "success") {
        toast({ 
          title: "Success", 
          description: "Followup added successfully" 
        });
        
        setAddDialogOpen(false);
        setSelectedLead(null);
        setFormData({
          mode: "Call",
          remark: "",
          status_update: "",
          next_followup_date: "",
        });
        
        await fetchFollowups();
      } else {
        toast({ 
          title: "Error", 
          description: res.message || "Failed to add followup", 
          variant: "destructive" 
        });
      }
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.message || "Something went wrong", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Proposal Sent': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Won': 'bg-emerald-100 text-emerald-800',
      'Lost': 'bg-red-100 text-red-800',
      'Follow-up': 'bg-indigo-100 text-indigo-800',
      'Not Interested': 'bg-gray-100 text-gray-800',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  const isToday = filterDate === new Date().toISOString().split('T')[0];

  const statusOptions = statuses.map(s => ({
    value: s.status_id || "",
    label: s.status_name
  }));

  const todayDate = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <MainLayout title="My Today Followup" subtitle="Today's followup tasks">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Today Followup" subtitle="Grouped by lead - Latest next followup date">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Followups</p>
              <p className="text-2xl font-bold">{groupedFollowups.length} leads</p>
            </div>
            <Badge className={`ml-2 ${isToday ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted'}`}>
              {isToday ? 'Today' : new Date(filterDate).toLocaleDateString()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filterDate}
                onChange={handleDateChange}
                className="pl-10 h-10 rounded-xl w-auto min-w-[160px]"
              />
            </div>
            <Button variant="outline" size="sm" className="rounded-xl h-10" onClick={fetchFollowups}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by lead name, phone, remark..."
            className="pl-10 h-10 rounded-xl"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {groupedFollowups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-medium text-muted-foreground">
              {searchTerm ? "No leads match your search" : "No followups scheduled for this date"}
            </p>
            <p className="text-sm text-muted-foreground/70">
              {isToday ? "You have no followups scheduled for today." : "Select a different date to view followups."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedFollowups.map((group) => {
              const isExpanded = expandedGroups.has(group.lead_id);
              const latest = group.latest_followup;
              
              return (
                <Card key={group.lead_id} className="rounded-2xl border-border overflow-hidden">
                  {/* Group Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleGroup(group.lead_id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate">
                            {group.lead_name || 'Unknown'}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {group.total_count} communications
                          </Badge>
                        </div>
                        {group.lead_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {group.lead_phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="rounded-xl gap-1 bg-success hover:bg-success/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddCommunication(group);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                      {latest?.status_update && (
                        <Badge className={`rounded-md text-xs ${getStatusColor(latest.status_update)}`}>
                          {latest.status_update}
                        </Badge>
                      )}
                      {latest?.next_followup_date && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Clock className="h-3 w-3" />
                          <span className="font-mono hidden sm:inline">
                            {new Date(latest.next_followup_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Group Details - Latest Communication (Always Visible) */}
                  <div className="px-4 pb-2">
                    <div className="bg-muted/20 rounded-xl p-3 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-primary text-primary-foreground text-xs">Latest</Badge>
                          <Badge variant="outline" className="text-xs rounded-md">
                            {latest?.mode || "Call"}
                          </Badge>
                          {latest?.followup_date === new Date().toISOString().split('T')[0] && (
                            <Badge className="text-xs bg-green-500/10 text-green-600 border-green-200">Today</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddCommunication(group);
                          }}
                        >
                          <MessageSquare className="h-3 w-3" />
                          Add Followup
                        </Button>
                      </div>
                      <p className="text-sm mt-1">{latest?.remark || "No communication"}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {latest?.followup_date ? new Date(latest.followup_date).toLocaleDateString() : ""}
                        </span>
                        {latest?.followup_by_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {latest.followup_by_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded History - Only visible when expanded */}
                  {isExpanded && group.followups.length > 1 && (
                    <div className="px-4 pb-4 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Previous Communications</p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {group.followups.slice(1).map((f: any) => (
                          <div key={f.followup_id} className="p-3 rounded-xl border border-border bg-muted/10">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                <PhoneCall className="w-3 h-3 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs rounded-md">
                                    {f.mode || "Call"}
                                  </Badge>
                                  {f.status_update && (
                                    <Badge className={`text-xs rounded-md ${getStatusColor(f.status_update)}`}>
                                      {f.status_update}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm mt-0.5">{f.remark}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {f.followup_date ? new Date(f.followup_date).toLocaleDateString() : ""}
                                  </span>
                                  {f.followup_by_name && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {f.followup_by_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Communication Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { if (!open && !saving) { setAddDialogOpen(false); setSelectedLead(null); } }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Communication</DialogTitle>
            <DialogDescription>
              Add a new followup for {selectedLead?.lead_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Lead Info */}
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-sm font-semibold">{selectedLead?.lead_name || 'Lead'}</p>
              {selectedLead?.lead_phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" /> {selectedLead.lead_phone}
                </p>
              )}
            </div>

            <div>
              <Label>Mode</Label>
              <div className="mt-1.5">
                <SearchableSelect
                  options={FOLLOWUP_MODES}
                  value={formData.mode || "Call"}
                  onChange={(v) => setFormData(p => ({ ...p, mode: v }))}
                  placeholder="Select mode..."
                />
              </div>
            </div>

            <div>
              <Label>Status Update <span className="text-destructive">*</span></Label>
              <div className="mt-1.5">
                <SearchableSelect
                  options={statusOptions}
                  value={formData.status_update || ""}
                  onChange={(v) => setFormData(p => ({ ...p, status_update: v }))}
                  placeholder="Select status..."
                  disabled={loadingStatuses}
                />
                {statusOptions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No statuses available. Please add statuses in Master &gt; Lead Status.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="remark">Remark <span className="text-destructive">*</span></Label>
              <Textarea
                id="remark"
                value={formData.remark || ""}
                onChange={(e) => {
                  setFormData(p => ({ ...p, remark: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="min-h-[80px] rounded-xl mt-1.5 resize-y"
                placeholder="Enter followup details..."
              />
            </div>

            <div>
              <Label>Next Followup Date</Label>
              <Input
                type="date"
                value={formData.next_followup_date || ""}
                onChange={(e) => handleNextFollowupDateChange(e.target.value)}
                className={`h-11 rounded-xl mt-1.5 ${nextFollowupError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                min={todayDate}
              />
              {nextFollowupError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {nextFollowupError}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {!nextFollowupError && "Set a future date for next followup (optional)"}
              </p>
            </div>

            {formError && (
              <div className="flex items-center gap-1.5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2 bg-success hover:bg-success/90"
              onClick={handleAddFollowup}
              disabled={saving || !!nextFollowupError}
              title={nextFollowupError || ""}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Send className="h-4 w-4" /> Add Communication</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={(open) => { if (!open && !deleting) { setDeleteDialog(false); setDeleteTarget(null); } }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Followup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this followup for{" "}
              <strong className="text-foreground">{deleteTarget?.lead_name || "this lead"}</strong>?
              This action cannot be undone.
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
    </MainLayout>
  );
}