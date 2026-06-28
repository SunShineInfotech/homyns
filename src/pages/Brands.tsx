// src/pages/Masters/Brands.tsx
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
import { brandService, Brand } from "@/services/brand.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";

type SortKey = "brand_name" | "brand_code";
type SortDir = "asc" | "desc";

const EMPTY_FORM: Partial<Brand> = { brand_name: "", brand_code: "" };

export default function Brands() {
  /* ── data ─────────────────────────────────────────────────────── */
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filtered, setFiltered] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("brand_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState<Partial<Brand>>(EMPTY_FORM);
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
  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await brandService.getBrands(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setBrands(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch brands", variant: "destructive" });
        setBrands([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...brands];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.brand_name?.toLowerCase().includes(q) ||
          b.brand_code?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "brand_name") {
        va = (a.brand_name || "").toLowerCase();
        vb = (b.brand_name || "").toLowerCase();
      } else {
        va = (a.brand_code || "").toLowerCase();
        vb = (b.brand_code || "").toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [brands, search, sortKey, sortDir]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

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
    setViewMode(false);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (b: Brand) => {
    setFormData({ brand_id: b.brand_id, brand_name: b.brand_name, brand_code: b.brand_code || "" });
    setIsEditing(true);
    setViewMode(false);
    setFormError("");
    setFormOpen(true);
  };

  const openView = (b: Brand) => {
    setFormData({ brand_id: b.brand_id, brand_name: b.brand_name, brand_code: b.brand_code || "" });
    setIsEditing(false);
    setViewMode(true);
    setFormError("");
    setFormOpen(true);
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.brand_name?.trim()) {
      setFormError("Brand name is required.");
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
      if (isEditing && formData.brand_id) {
        res = await brandService.updateBrand({
          brand_id: formData.brand_id,
          brand_name: formData.brand_name!.trim(),
          brand_code: formData.brand_code?.trim() || ''
        });
      } else {
        res = await brandService.addBrand({
          company_id: getCompanyId(),
          brand_name: formData.brand_name!.trim(),
          brand_code: formData.brand_code?.trim() || ''
        });
      }

      if (res.status === "success") {
        toast({ title: "Success", description: isEditing ? "Brand updated successfully" : "Brand added successfully" });
        setConfirmOpen(false);
        await fetchBrands();
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
  const askDelete = (b: Brand) => {
    setDeleteTarget(b);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.brand_id) return;
    setDeleting(true);
    try {
      const res = await brandService.deleteBrand(deleteTarget.brand_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Brand deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchBrands();
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
    <MainLayout title="Brand Master" subtitle="Manage product brands">
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code…"
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
              {filtered.length} {filtered.length === 1 ? "brand" : "brands"}
            </Badge>
            <Button onClick={openAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Brand
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
              <Tag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No brands match your search" : "No brands added yet"}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first brand
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
                      onClick={() => toggleSort("brand_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Brand Name <SortIcon col="brand_name" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("brand_code")}
                    >
                      <span className="flex items-center gap-1.5">
                        Brand Code <SortIcon col="brand_code" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((b, idx) => (
                    <tr key={b.brand_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{b.brand_name}</td>
                      <td className="px-4 py-3">
                        {b.brand_code ? (
                          <Badge variant="outline" className="rounded-md font-mono text-xs">{b.brand_code}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                            onClick={() => openEdit(b)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(b)}
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
              {filtered.map((b, idx) => (
                <div key={b.brand_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{b.brand_name}</p>
                    {b.brand_code && (
                      <p className="text-xs text-muted-foreground mt-0.5">Code: {b.brand_code}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                      onClick={() => openEdit(b)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(b)}
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
              {viewMode ? "View Brand" : isEditing ? "Edit Brand" : "Add New Brand"}
            </DialogTitle>
            <DialogDescription>
              {viewMode ? "View brand details" : isEditing ? "Update the brand details below." : "Fill in the details to add a new brand."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="brand_name">
                Brand Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand_name"
                value={formData.brand_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, brand_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Asian Paints, Berger, etc."
                disabled={viewMode}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="brand_code">Brand Code <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Input
                id="brand_code"
                value={formData.brand_code || ""}
                onChange={(e) => setFormData((p) => ({ ...p, brand_code: e.target.value.toUpperCase() }))}
                className="h-11 rounded-xl mt-1.5 font-mono"
                placeholder="e.g. AP, BGR"
                maxLength={20}
                disabled={viewMode}
              />
              <p className="text-xs text-muted-foreground mt-1">Short code for the brand (e.g. AP, BGR)</p>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setFormOpen(false)}>
              {viewMode ? "Close" : "Cancel"}
            </Button>
            {!viewMode && (
              <Button className="rounded-xl h-11 flex-1 sm:flex-none" onClick={handleFormSubmit}>
                {isEditing ? "Update Brand" : "Add Brand"}
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
                ? <>Are you sure you want to update <strong className="text-foreground">{formData.brand_name}</strong>?</>
                : <>Add <strong className="text-foreground">{formData.brand_name}</strong> to your brands?</>}
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
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.brand_name}</strong>?
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