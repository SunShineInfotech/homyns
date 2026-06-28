// src/pages/Masters/RawMaterialTypes.tsx
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
import { rmTypeService, RawMaterialType } from "@/services/rm-type.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";

type SortKey = "rm_type_name";
type SortDir = "asc" | "desc";

const EMPTY_FORM: Partial<RawMaterialType> = { rm_type_name: "" };

export default function RawMaterialTypes() {
  /* ── data ─────────────────────────────────────────────────────── */
  const [types, setTypes] = useState<RawMaterialType[]>([]);
  const [filtered, setFiltered] = useState<RawMaterialType[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rm_type_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RawMaterialType | null>(
    null,
  );

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData, setFormData] =
    useState<Partial<RawMaterialType>>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewMode, setViewMode] = useState(false);

  /* ── helpers ──────────────────────────────────────────────────── */
  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      /* ignore */
    }
    return "";
  };

  /* ── fetch ────────────────────────────────────────────────────── */
  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({
          title: "Error",
          description: "Company not found. Please login again.",
          variant: "destructive",
        });
        return;
      }
      const res = await rmTypeService.getRawMaterialTypes(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setTypes(res.data);
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to fetch raw material types",
          variant: "destructive",
        });
        setTypes([]);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...types];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.rm_type_name?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const va = (a.rm_type_name || "").toLowerCase();
      const vb = (b.rm_type_name || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [types, search, sortKey, sortDir]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  /* ── sort toggle ──────────────────────────────────────────────── */
  const toggleSort = () => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const SortIcon = () =>
    sortDir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );

  /* ── open form ────────────────────────────────────────────────── */
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setViewMode(false);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (t: RawMaterialType) => {
    setFormData({ rm_type_id: t.rm_type_id, rm_type_name: t.rm_type_name });
    setIsEditing(true);
    setViewMode(false);
    setFormError("");
    setFormOpen(true);
  };

  const openView = (t: RawMaterialType) => {
    setFormData({ rm_type_id: t.rm_type_id, rm_type_name: t.rm_type_name });
    setIsEditing(false);
    setViewMode(true);
    setFormError("");
    setFormOpen(true);
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.rm_type_name?.trim()) {
      setFormError("Raw material type name is required.");
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
      if (isEditing && formData.rm_type_id) {
        res = await rmTypeService.updateRawMaterialType({
          rm_type_id: formData.rm_type_id,
          rm_type_name: formData.rm_type_name!.trim(),
        });
      } else {
        res = await rmTypeService.addRawMaterialType({
          company_id: getCompanyId(),
          rm_type_name: formData.rm_type_name!.trim(),
        });
      }

      if (res.status === "success") {
        toast({
          title: "Success",
          description: isEditing
            ? "Raw material type updated successfully"
            : "Raw material type added successfully",
        });
        setConfirmOpen(false);
        await fetchTypes();
      } else {
        toast({
          title: "Error",
          description: res.message || "Operation failed",
          variant: "destructive",
        });
        setConfirmOpen(false);
        setFormOpen(true);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      setConfirmOpen(false);
      setFormOpen(true);
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ───────────────────────────────────────────────────── */
  const askDelete = (t: RawMaterialType) => {
    setDeleteTarget(t);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.rm_type_id) return;
    setDeleting(true);
    try {
      const res = await rmTypeService.deleteRawMaterialType(
        deleteTarget.rm_type_id,
      );
      if (res.status === "success") {
        toast({
          title: "Success",
          description: "Raw material type deleted successfully",
        });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchTypes();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to delete",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <MainLayout
      title="Raw Material Type Master"
      subtitle="Manage raw material types"
    >
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search raw material types…"
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
            <Badge
              variant="secondary"
              className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              {filtered.length} {filtered.length === 1 ? "type" : "types"}
            </Badge>
            <Button
              onClick={openAdd}
              className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Type
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
        ) : /* empty */
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Layers className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search
                ? "No raw material types match your search"
                : "No raw material types added yet"}
            </p>
            {!search && (
              <Button
                onClick={openAdd}
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add your first type
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">
                      #
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={toggleSort}
                    >
                      <span className="flex items-center gap-1.5">
                        Type Name <SortIcon />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-36">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((t, idx) => (
                    <tr
                      key={t.rm_type_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {t.rm_type_name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                            onClick={() => openEdit(t)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(t)}
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
              {filtered.map((t, idx) => (
                <div
                  key={t.rm_type_id}
                  className="flex items-center gap-3 rounded-2xl border p-4 bg-card"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{t.rm_type_name}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(t)}
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
      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) setFormOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode
                ? "View Raw Material Type"
                : isEditing
                  ? "Edit Raw Material Type"
                  : "Add New Raw Material Type"}
            </DialogTitle>
            <DialogDescription>
              {viewMode
                ? "View raw material type details"
                : isEditing
                  ? "Update the type details below."
                  : "Fill in the details to add a new raw material type."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="rm_type_name">
                Type Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rm_type_name"
                value={formData.rm_type_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, rm_type_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Fixed, Consumable, Hardware, etc."
                disabled={viewMode}
                autoFocus
              />
              {formError && (
                <p className="text-xs text-destructive mt-1.5">{formError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl h-11 flex-1 sm:flex-none"
              onClick={() => setFormOpen(false)}
            >
              {viewMode ? "Close" : "Cancel"}
            </Button>
            {!viewMode && (
              <Button
                className="rounded-xl h-11 flex-1 sm:flex-none"
                onClick={handleFormSubmit}
              >
                {isEditing ? "Update Type" : "Add Type"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          SAVE CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(o) => {
          if (!o && !saving) setConfirmOpen(false);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {isEditing ? "Update" : "Add"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing ? (
                <>
                  Are you sure you want to update{" "}
                  <strong className="text-foreground">
                    {formData.rm_type_name}
                  </strong>
                  ?
                </>
              ) : (
                <>
                  Add{" "}
                  <strong className="text-foreground">
                    {formData.rm_type_name}
                  </strong>{" "}
                  to your raw material types?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel
              disabled={saving}
              className="rounded-xl h-11 flex-1 sm:flex-none mt-0"
              onClick={() => {
                setConfirmOpen(false);
                setFormOpen(true);
              }}
            >
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className="rounded-xl h-11 flex-1 sm:flex-none gap-2"
              onClick={handleConfirmed}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                "Yes, Update"
              ) : (
                "Yes, Add"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => {
          if (!o && !deleting) {
            setDeleteConfirm(false);
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Raw Material Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deleteTarget?.rm_type_name}
              </strong>
              ? This action cannot be undone.
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
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Yes, Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
