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
  UserCheck,
  Building2,
} from "lucide-react";

export default function AllLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [convertConfirm, setConvertConfirm] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);

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
        setLeads([]);
        return;
      }
      const res = await leadService.getLeads(companyId, 'all');
      console.log('AllLeads fetchLeads response:', res);
      
      if (res.status === "success" && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setLeads([]);
        if (res.message) {
          toast({ title: "Error", description: res.message, variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error('AllLeads fetchLeads error:', e);
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
          l.email?.toLowerCase().includes(q) ||
          l.project_name?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [leads, search]);

  const handleConvertToClient = async () => {
    if (!convertTarget?.lead_id) return;
    setConverting(true);
    try {
      const res = await leadService.convertToClient(convertTarget.lead_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Lead converted to client successfully" });
        setConvertConfirm(false);
        setConvertTarget(null);
        await fetchLeads();
      } else {
        toast({ title: "Error", description: res.message || "Failed to convert", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
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
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, phone, email, project..."
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
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned To</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((lead, idx) => (
                    <tr key={lead.lead_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{lead.lead_name}</td>
                      <td className="px-4 py-3">{lead.phone1}</td>
                      <td className="px-4 py-3">{lead.project_name || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(lead.status_name || lead.status)}>
                          {lead.status_name || lead.status || "New"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{lead.assigned_emp_name || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {lead.converted_client_id ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs whitespace-nowrap">
                              <UserCheck className="h-3 w-3 mr-1" /> Converted
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                              onClick={() => {
                                setConvertTarget(lead);
                                setConvertConfirm(true);
                              }}
                              title="Convert to Client"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
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
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { setDeleteTarget(lead); setDeleteConfirm(true); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
              {filtered.map((lead) => (
                <Card key={lead.lead_id} className="p-4 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{lead.lead_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {lead.phone1}
                      </p>
                      {lead.email && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" /> {lead.email}
                        </p>
                      )}
                      {lead.project_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" /> {lead.project_name}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(lead.status_name || lead.status)}>
                      {lead.status_name || lead.status || "New"}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {lead.source_name && (
                      <Badge variant="secondary" className="rounded-md text-xs px-2 py-0.5">{lead.source_name}</Badge>
                    )}
                    {lead.project_type_name && (
                      <Badge variant="outline" className="rounded-md text-xs px-2 py-0.5">{lead.project_type_name}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{lead.assigned_emp_name || "Unassigned"}</span>
                    <div className="flex gap-1">
                      {!lead.converted_client_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                          onClick={() => {
                            setConvertTarget(lead);
                            setConvertConfirm(true);
                          }}
                          title="Convert to Client"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
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
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setDeleteTarget(lead); setDeleteConfirm(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
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

      {/* Convert to Client Confirmation Dialog */}
      <AlertDialog open={convertConfirm} onOpenChange={(o) => { if (!o && !converting) { setConvertConfirm(false); setConvertTarget(null); } }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to convert <strong className="text-foreground">{convertTarget?.lead_name}</strong> to a client?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                This will create a client record and link it to this lead. The lead will be marked as converted.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToClient} disabled={converting} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {converting ? <><Loader2 className="h-4 w-4 animate-spin" /> Converting...</> : "Yes, Convert to Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}