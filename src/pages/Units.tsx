// src/pages/Masters/Units.tsx
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
import { unitService, Unit } from "@/services/unit.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Ruler,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";

type SortKey = "unit_name";
type SortDir = "asc" | "desc";

const EMPTY_FORM: Partial<Unit> = { unit_name: "" };

export default function Units() {
  /* ── data ─────────────────────────────────────────────────────── */
  const [units, setUnits] = useState<Unit[]>([]);
  const [filtered, setFiltered] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("unit_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState<Partial<Unit>>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewMode, setViewMode] = useState(false);

  /* ── helpers ──────────────────────────────────────────────────── */
  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  /* ── fetch ────────────────────────────────────────────────────── */
  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await unitService.getUnits(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setUnits(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch units", variant: "destructive" });
        setUnits([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...units];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.unit_name?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const va = (a.unit_name || "").toLowerCase();
      const vb = (b.unit_name || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [units, search, sortKey, sortDir]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  /* ── sort toggle ──────────────────────────────────────────────── */
  const toggleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const SortIcon = () =>
    sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;

  /* ── open form ────────────────────────────────────────────────── */
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setViewMode(false);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (u: Unit) => {
    setFormData({ unit_id: u.unit_id, unit_name: u.unit_name });
    setIsEditing(true);
    setViewMode(false);
    setFormError("");
    setFormOpen(true);
  };

  const openView = (u: Unit) => {
    setFormData({ unit_id: u.unit_id, unit_name: u.unit_name });
    setIsEditing(false);
    setViewMode(true);
    setFormError("");
    setFormOpen(true);
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.unit_name?.trim()) {
      setFormError("Unit name is required.");
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
      if (isEditing && formData.unit_id) {
        res = await unitService.updateUnit({
          unit_id: formData.unit_id,
          unit_name: formData.unit_name!.trim(),
        });
      } else {
        res = await unitService.addUnit({
          company_id: getCompanyId(),
          unit_name: formData.unit_name!.trim(),
        });
      }

      if (res.status === "success") {
        toast({ title: "Success", description: isEditing ? "Unit updated successfully" : "Unit added successfully" });
        setConfirmOpen(false);
        await fetchUnits();
      } else {
        toast({ title: "Error", description: res.message || "Operation failed", variant: "destructive" });
        setConfirmOpen(false);
        setFormOpen(true);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setConfirmOpen(false);
      setFormOpen(true);
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ───────────────────────────────────────────────────── */
  const askDelete = (u: Unit) => {
    setDeleteTarget(u);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.unit_id) return;
    setDeleting(true);
    try {
      const res = await unitService.deleteUnit(deleteTarget.unit_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Unit deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchUnits();
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
    <MainLayout title="Unit Master" subtitle="Manage measurement units">
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search units…"
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
              {filtered.length} {filtered.length === 1 ? "unit" : "units"}
            </Badge>
            <Button onClick={openAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Unit
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
              <Ruler className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No units match your search" : "No units added yet"}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first unit
              </Button>
            )}
          </div>

        ) : (
          <>
            {/* desktop table */}
            <div className="hidden md:block rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={toggleSort}
                    >
                      <span className="flex items-center gap-1.5">
                        Unit Name <SortIcon />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((u, idx) => (
                    <tr key={u.unit_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{u.unit_name}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                            onClick={() => openEdit(u)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(u)}
                            title="Delete"
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

            {/* mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((u, idx) => (
                <div key={u.unit_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{u.unit_name}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                   
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(u)}
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
          ADD / EDIT / VIEW FORM DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode ? "View Unit" : isEditing ? "Edit Unit" : "Add New Unit"}
            </DialogTitle>
            <DialogDescription>
              {viewMode ? "View unit details" : isEditing ? "Update the unit details below." : "Fill in the details to add a new unit."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="unit_name">
                Unit Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit_name"
                value={formData.unit_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, unit_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Piece, Kilogram, Meter, etc."
                disabled={viewMode}
                autoFocus
              />
              {formError && <p className="text-xs text-destructive mt-1.5">{formError}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setFormOpen(false)}>
              {viewMode ? "Close" : "Cancel"}
            </Button>
            {!viewMode && (
              <Button className="rounded-xl h-11 flex-1 sm:flex-none" onClick={handleFormSubmit}>
                {isEditing ? "Update Unit" : "Add Unit"}
              </Button>
            )}
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
                ? <>Are you sure you want to update <strong className="text-foreground">{formData.unit_name}</strong>?</>
                : <>Add <strong className="text-foreground">{formData.unit_name}</strong> to your units?</>}
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
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.unit_name}</strong>?
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