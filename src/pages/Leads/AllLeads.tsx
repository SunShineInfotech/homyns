// src/pages/Leads/AllLeads.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Filter,
} from "lucide-react";

export default function AllLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { return ""; }
    return "";
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        return;
      }
      const res = await leadService.getLeads(companyId, 'all');
      if (res.status === "success" && res.data) {
        setLeads(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch leads", variant: "destructive" });
        setLeads([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
          l.email?.toLowerCase().includes(q)
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

  if (loading) {
    return (
      <MainLayout title="All Leads" subtitle="View all leads">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="All Leads" subtitle="Manage all leads">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, phone, email..."
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
            </Badge>
            <Button onClick={() => navigate("/lead/form")} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No leads match your search" : "No leads added yet"}
            </p>
            {!search && (
              <Button onClick={() => navigate("/lead/form")} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first lead
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lead) => (
              <Card key={lead.lead_id} className="p-5 rounded-2xl hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{lead.lead_name}</h3>
                    {lead.phone1 && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {lead.phone1}
                      </p>
                    )}
                    {lead.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="h-3 w-3 shrink-0" /> {lead.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => navigate(`/lead/view/${lead.lead_id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" onClick={() => navigate(`/lead/form/${lead.lead_id}`)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setDeleteTarget(lead); setDeleteConfirm(true); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {lead.source_name && (
                    <Badge variant="secondary" className="rounded-md text-xs px-2 py-0.5">{lead.source_name}</Badge>
                  )}
                  {lead.status && (
                    <Badge className={`rounded-md text-xs px-2 py-0.5 ${getStatusColor(lead.status_name || lead.status)}`}>
                      {lead.status_name || lead.status}
                    </Badge>
                  )}
                </div>

                {lead.address && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1 mt-3">
                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                    <span className="truncate">{lead.address}</span>
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span>{lead.assigned_emp_name || "Unassigned"}</span>
                  <span>{lead.c_date ? new Date(lead.c_date).toLocaleDateString() : ""}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
    </MainLayout>
  );
}