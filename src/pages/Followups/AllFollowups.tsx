// src/pages/Followups/AllFollowups.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { followupService, Followup } from "@/services/followup.service";
import { leadService } from "@/services/lead.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  PhoneCall,
  Calendar,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";

const FOLLOWUP_MODES = [
  { value: "Call", label: "Call" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Email", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "Visit", label: "Visit" },
  { value: "Other", label: "Other" },
];

export default function AllFollowups() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filtered, setFiltered] = useState<Followup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Followup | null>(null);

  // Form dialog
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Followup>>({});
  const [formError, setFormError] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Lead statuses
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  // Date validation
  const [nextFollowupError, setNextFollowupError] = useState("");

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

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        return;
      }
      const res = await followupService.getFollowups(companyId, 'all');
      if (res.status === "success" && res.data) {
        setFollowups(res.data);
      } else {
        setFollowups([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) return;
      const res = await leadService.getLeads(companyId, 'all');
      if (res.status === "success" && res.data) {
        setLeads(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch leads", e);
    } finally {
      setLoadingLeads(false);
    }
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

  useEffect(() => {
    fetchFollowups();
    fetchStatuses();
  }, [fetchFollowups]);

  useEffect(() => {
    let list = [...followups];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.lead_name?.toLowerCase().includes(q) ||
          f.remark?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [followups, search]);

  const openAddForm = () => {
    setFormData({
      followup_date: new Date().toISOString().split('T')[0],
      mode: "Call",
      status_update: "",
      next_followup_date: "",
    });
    setIsEditing(false);
    setLeadName("");
    setLeadPhone("");
    setFormError("");
    setNextFollowupError("");
    setFormOpen(true);
    fetchLeads();
  };

  const openEditForm = (followup: Followup) => {
    setFormData(followup);
    setIsEditing(true);
    setLeadName(followup.lead_name || "");
    setLeadPhone(followup.lead_phone || "");
    setFormError("");
    setNextFollowupError("");
    setFormOpen(true);
    fetchLeads();
  };

  const handleLeadSelect = (leadId: string) => {
    const selectedLead = leads.find(l => l.lead_id === leadId);
    if (selectedLead) {
      setLeadName(selectedLead.lead_name || "");
      setLeadPhone(selectedLead.phone1 || "");
      setFormData(p => ({ ...p, lead_id: leadId }));
    }
    setFormError("");
  };

  const handleNextFollowupDateChange = (value: string) => {
    setFormData(p => ({ ...p, next_followup_date: value }));
    setNextFollowupError("");
    
    // Validate that next followup date is not in the past
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

  const handleFormSubmit = async () => {
    if (!formData.lead_id) {
      setFormError("Please select a lead");
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
    
    // Validate next followup date is not in the past
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
        lead_id: formData.lead_id,
        followup_date: formData.followup_date || new Date().toISOString().split('T')[0],
        next_followup_date: formData.next_followup_date || "",
        followup_by: empId,
        mode: formData.mode || "Call",
        remark: formData.remark.trim(),
        status_update: formData.status_update,
      };

      let res;
      if (isEditing && formData.followup_id) {
        res = await followupService.updateFollowup({ ...payload, followup_id: formData.followup_id });
      } else {
        res = await followupService.addFollowup(payload);
      }

      if (res.status === "success") {
        toast({ title: "Success", description: isEditing ? "Followup updated" : "Followup added" });
        setFormOpen(false);
        await fetchFollowups();
      } else {
        toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.followup_id) return;
    setDeleting(true);
    try {
      const res = await followupService.deleteFollowup(deleteTarget.followup_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Followup deleted" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchFollowups();
      } else {
        toast({ title: "Error", description: res.message || "Failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const leadOptions = leads.map(l => ({
    value: l.lead_id || "",
    label: `${l.lead_name} (${l.phone1 || "No Phone"})`
  }));

  const statusOptions = statuses.map(s => ({
    value: s.status_id || "",
    label: s.status_name
  }));

  // Get today's date for min attribute
  const todayDate = new Date().toISOString().split('T')[0];

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
              placeholder="Search followups..."
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium">
              {filtered.length} followups
            </Badge>
            <Button onClick={openAddForm} className="h-10 rounded-xl gap-2 px-4">
              <Plus className="h-4 w-4" /> Add Followup
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No followups match your search" : "No followups added yet"}
            </p>
            {!search && (
              <Button onClick={openAddForm} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first followup
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => (
              <Card key={f.followup_id} className="p-4 rounded-2xl hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{f.lead_name || "Lead"}</span>
                      {f.lead_phone && (
                        <span className="text-sm text-muted-foreground">({f.lead_phone})</span>
                      )}
                      <Badge variant="outline" className="rounded-md text-xs">
                        {f.mode || "Call"}
                      </Badge>
                      <Badge className="rounded-md text-xs bg-primary/10 text-primary">
                        {f.followup_by_name || "System"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5">{f.remark}</p>
                    {f.status_update && (
                      <p className="text-xs text-primary mt-1">Status: {f.status_update}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {f.followup_date ? new Date(f.followup_date).toLocaleDateString() : ""}
                      </span>
                      {f.next_followup_date && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="h-3 w-3" />
                          Next: {new Date(f.next_followup_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" onClick={() => openEditForm(f)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setDeleteTarget(f); setDeleteConfirm(true); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Followup Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o && !saving) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Followup" : "Add Followup"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Lead <span className="text-destructive">*</span></Label>
              <div className="mt-1.5">
                <SearchableSelect
                  options={leadOptions}
                  value={formData.lead_id || ""}
                  onChange={handleLeadSelect}
                  placeholder="Search lead by name or phone..."
                  disabled={loadingLeads}
                />
                {leadName && leadPhone && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {leadName} {leadPhone && `(${leadPhone})`}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Followup Date</Label>
                <Input
                  type="date"
                  value={formData.followup_date || ""}
                  onChange={(e) => setFormData(p => ({ ...p, followup_date: e.target.value }))}
                  className="h-11 rounded-xl mt-1.5"
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
                  {!nextFollowupError && "Cannot be in the past"}
                </p>
              </div>
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
              <Label htmlFor="remark">Remark <span className="text-destructive">*</span></Label>
              <Textarea
                id="remark"
                value={formData.remark || ""}
                onChange={(e) => setFormData(p => ({ ...p, remark: e.target.value }))}
                className="min-h-[80px] rounded-xl mt-1.5 resize-y"
                placeholder="Enter followup details..."
              />
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

            {formError && (
              <div className="flex items-center gap-1.5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-11" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button 
              className="rounded-xl h-11 gap-2" 
              onClick={handleFormSubmit} 
              disabled={saving || !!nextFollowupError}
              title={nextFollowupError || ""}
            >
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteConfirm} onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); } }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Followup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this followup for <strong>{deleteTarget?.lead_name}</strong>?
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