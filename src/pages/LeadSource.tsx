// src/pages/Masters/LeadSource.tsx
import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { toast } from "@/hooks/use-toast";
import { leadSourceService, LeadSource } from "@/services/lead-source.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";

type SortKey = "source_name";
type SortDir = "asc" | "desc";

const EMPTY_FORM: Partial<LeadSource> = { source_name: "" };

export default function LeadSource() {
  /* ── data ─────────────────────────────────────────────────────── */
  const [sources,   setSources]   = useState<LeadSource[]>([]);
  const [filtered, setFiltered] = useState<LeadSource[]>([]);
  const [search,   setSearch]   = useState("");
  const [sortKey,  setSortKey]  = useState<SortKey>("source_name");
  const [sortDir,  setSortDir]  = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [formOpen,      setFormOpen]      = useState(false);
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<LeadSource | null>(null);

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData,  setFormData]  = useState<Partial<LeadSource>>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── helpers ──────────────────────────────────────────────────── */
  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  /* ── fetch ────────────────────────────────────────────────────── */
  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await leadSourceService.getLeadSources(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setSources(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch lead sources", variant: "destructive" });
        setSources([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...sources];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.source_name?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const va = (a[sortKey] || "").toLowerCase();
      const vb = (b[sortKey] || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [sources, search, sortKey, sortDir]);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  /* ── sort toggle ──────────────────────────────────────────────── */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col
      ? <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
      : sortDir === "asc"
        ? <ChevronUp className="h-3.5 w-3.5" />
        : <ChevronDown className="h-3.5 w-3.5" />;

  /* ── open form ────────────────────────────────────────────────── */
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (s: LeadSource) => {
    setFormData({ source_id: s.source_id, source_name: s.source_name });
    setIsEditing(true);
    setFormError("");
    setFormOpen(true);
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.source_name?.trim()) {
      setFormError("Source name is required.");
      return;
    }
    setFormError("");
    setFormOpen(false);
    setConfirmOpen(true);
  };

  /* ── confirmed → API call ─────────────────────────────────────── */
  const handleConfirmed = async () => {
    setSaving(true);
    try {
      let res;
      if (isEditing && formData.source_id) {
        res = await leadSourceService.updateLeadSource({
          source_id:   formData.source_id,
          source_name: formData.source_name!.trim(),
        });
      } else {
        res = await leadSourceService.addLeadSource({
          company_id: getCompanyId(),
          source_name: formData.source_name!.trim(),
        });
      }

      if (res.status === "success") {
        toast({ 
          title: "Success", 
          description: isEditing ? "Lead source updated successfully" : "Lead source added successfully" 
        });
        setConfirmOpen(false);
        await fetchSources();
      } else {
        toast({ 
          title: "Error", 
          description: res.message || "Operation failed", 
          variant: "destructive" 
        });
        setConfirmOpen(false);
        setFormOpen(true);
      }
    } catch (e: any) {
      toast({ 
        title: "Error", 
        description: e?.response?.data?.message || "Something went wrong", 
        variant: "destructive" 
      });
      setConfirmOpen(false);
      setFormOpen(true);
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ───────────────────────────────────────────────────── */
  const askDelete = (s: LeadSource) => {
    setDeleteTarget(s);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.source_id) return;
    setDeleting(true);
    try {
      const res = await leadSourceService.deleteLeadSource(deleteTarget.source_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Lead source deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchSources();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <MainLayout title="Lead Source Master" subtitle="Manage lead sources">
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead sources…"
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "source" : "sources"}
            </Badge>
            <Button onClick={openAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Source
            </Button>
          </div>
        </div>

        {/* skeleton */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>

        /* empty */
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No lead sources match your search" : "No lead sources added yet"}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first lead source
              </Button>
            )}
          </div>

        ) : (
          <>
            {/* desktop table - Actions always visible */}
            <div className="hidden md:block rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("source_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Source Name <SortIcon col="source_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">ID</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s, idx) => (
                    <tr key={s.source_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{s.source_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="rounded-md font-mono text-xs">
                          #{s.source_id}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(s)}
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

            {/* mobile cards - Actions always visible */}
            <div className="md:hidden space-y-2">
              {filtered.map((s, idx) => (
                <div key={s.source_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.source_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: #{s.source_id}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADD / EDIT FORM DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Lead Source" : "Add New Lead Source"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the lead source details below." : "Fill in the details to add a new lead source."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="source_name">
                Source Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="source_name"
                value={formData.source_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, source_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Facebook, Google, Referral, etc."
                autoFocus
              />
              {formError && <p className="text-xs text-destructive mt-1.5">{formError}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Enter the name of the lead source (e.g. Instagram, WhatsApp, Website, etc.)
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-11 flex-1 sm:flex-none" onClick={handleFormSubmit}>
              {isEditing ? "Update Source" : "Add Source"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          SAVE CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════════ */}
      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!o && !saving) setConfirmOpen(false); }}>
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {isEditing ? "Update" : "Add"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing
                ? <>Are you sure you want to update <strong className="text-foreground">{formData.source_name}</strong>?</>
                : <>Add <strong className="text-foreground">{formData.source_name}</strong> to your lead sources?</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel
              disabled={saving}
              className="rounded-xl h-11 flex-1 sm:flex-none mt-0"
              onClick={() => { setConfirmOpen(false); setFormOpen(true); }}
            >
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className="rounded-xl h-11 flex-1 sm:flex-none gap-2"
              onClick={handleConfirmed}
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                : isEditing ? "Yes, Update" : "Yes, Add"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); }}}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.source_name}</strong>?
              This action cannot be undone.
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
              {deleting
                ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting…</>
                : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}