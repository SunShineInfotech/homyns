// src/pages/Masters/LeadStatus.tsx
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
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Flag,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Palette,
} from "lucide-react";

type SortKey = "status_name";
type SortDir = "asc" | "desc";

const DEFAULT_FONT_COLOR = "#ffffff";
const DEFAULT_BG_COLOR = "#6b7280";

const PRESET_COLORS = [
  { bg: "#3b82f6", font: "#ffffff", label: "Blue" },
  { bg: "#22c55e", font: "#ffffff", label: "Green" },
  { bg: "#ef4444", font: "#ffffff", label: "Red" },
  { bg: "#f59e0b", font: "#1f2937", label: "Yellow" },
  { bg: "#8b5cf6", font: "#ffffff", label: "Purple" },
  { bg: "#ec4899", font: "#ffffff", label: "Pink" },
  { bg: "#14b8a6", font: "#ffffff", label: "Teal" },
  { bg: "#f97316", font: "#ffffff", label: "Orange" },
  { bg: "#6366f1", font: "#ffffff", label: "Indigo" },
  { bg: "#6b7280", font: "#ffffff", label: "Gray" },
  { bg: "#1f2937", font: "#ffffff", label: "Dark" },
  { bg: "#10b981", font: "#ffffff", label: "Emerald" },
];

const EMPTY_FORM: Partial<LeadStatus> = {
  status_name: "",
  font_color: DEFAULT_FONT_COLOR,
  background_color: DEFAULT_BG_COLOR
};

export default function LeadStatus() {
  /* ── data ─────────────────────────────────────────────────────── */
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [filtered, setFiltered] = useState<LeadStatus[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("status_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeadStatus | null>(null);

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState<Partial<LeadStatus>>(EMPTY_FORM);
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
  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await leadStatusService.getLeadStatuses(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setStatuses(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch lead statuses", variant: "destructive" });
        setStatuses([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...statuses];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.status_name?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const va = (a[sortKey] || "").toLowerCase();
      const vb = (b[sortKey] || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [statuses, search, sortKey, sortDir]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

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
    setFormData({ ...EMPTY_FORM });
    setIsEditing(false);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (s: LeadStatus) => {
    setFormData({
      status_id: s.status_id,
      status_name: s.status_name,
      font_color: s.font_color || DEFAULT_FONT_COLOR,
      background_color: s.background_color || DEFAULT_BG_COLOR
    });
    setIsEditing(true);
    setFormError("");
    setFormOpen(true);
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.status_name?.trim()) {
      setFormError("Status name is required.");
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
      if (isEditing && formData.status_id) {
        res = await leadStatusService.updateLeadStatus({
          status_id: formData.status_id,
          status_name: formData.status_name!.trim(),
          font_color: formData.font_color || DEFAULT_FONT_COLOR,
          background_color: formData.background_color || DEFAULT_BG_COLOR,
        });
      } else {
        res = await leadStatusService.addLeadStatus({
          company_id: getCompanyId(),
          status_name: formData.status_name!.trim(),
          font_color: formData.font_color || DEFAULT_FONT_COLOR,
          background_color: formData.background_color || DEFAULT_BG_COLOR,
        });
      }

      if (res.status === "success") {
        toast({
          title: "Success",
          description: isEditing ? "Lead status updated successfully" : "Lead status added successfully"
        });
        setConfirmOpen(false);
        await fetchStatuses();
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
  const askDelete = (s: LeadStatus) => {
    setDeleteTarget(s);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.status_id) return;
    setDeleting(true);
    try {
      const res = await leadStatusService.deleteLeadStatus(deleteTarget.status_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Lead status deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchStatuses();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  /* ── handle color preset selection ───────────────────────────── */
  const handleColorSelect = (bg: string, font: string) => {
    setFormData(prev => ({
      ...prev,
      background_color: bg,
      font_color: font
    }));
  };

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <MainLayout title="Lead Status Master" subtitle="Manage lead statuses with colors">
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead statuses…"
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
              {filtered.length} {filtered.length === 1 ? "status" : "statuses"}
            </Badge>
            <Button onClick={openAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Status
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
              <Flag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No lead statuses match your search" : "No lead statuses added yet"}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first lead status
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
                      onClick={() => toggleSort("status_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Status Name <SortIcon col="status_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-40">Colors</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">ID</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s, idx) => (
                    <tr key={s.status_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className="rounded-md px-3 py-1"
                          style={{
                            backgroundColor: s.background_color || DEFAULT_BG_COLOR,
                            color: s.font_color || DEFAULT_FONT_COLOR,
                          }}
                        >
                          {s.status_name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-md border"
                            style={{
                              backgroundColor: s.background_color || DEFAULT_BG_COLOR,
                              borderColor: s.background_color === '#ffffff' ? '#e5e7eb' : 'transparent'
                            }}
                          />
                          <span className="text-xs text-muted-foreground">→</span>
                          <div
                            className="w-8 h-8 rounded-md border flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: s.font_color || DEFAULT_FONT_COLOR,
                              color: s.background_color || DEFAULT_BG_COLOR,
                              borderColor: s.font_color === '#ffffff' ? '#e5e7eb' : 'transparent'
                            }}
                          >
                            A
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="rounded-md font-mono text-xs">
                          #{s.status_id}
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

            {/* mobile cards */}
            <div className="md:hidden space-y-2">
              {filtered.map((s, idx) => (
                <div key={s.status_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: s.background_color || DEFAULT_BG_COLOR,
                      color: s.font_color || DEFAULT_FONT_COLOR
                    }}
                  >
                    {s.status_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge
                      className="rounded-md px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: s.background_color || DEFAULT_BG_COLOR,
                        color: s.font_color || DEFAULT_FONT_COLOR,
                      }}
                    >
                      {s.status_name}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: #{s.status_id}</p>
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

      {/* ── ADD / EDIT FORM DIALOG ── */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Lead Status" : "Add New Lead Status"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the lead status details below." : "Fill in the details to add a new lead status."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="status_name">
                Status Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="status_name"
                value={formData.status_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, status_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. New, Contacted, Qualified, etc."
                autoFocus
              />
              {formError && <p className="text-xs text-destructive mt-1.5">{formError}</p>}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Status Colors
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Select a color preset or use the color pickers below
              </p>

              {/* Preset Colors */}
              <div className="grid grid-cols-6 gap-2 mb-3">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.bg}
                    type="button"
                    className="w-full aspect-square rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{
                      backgroundColor: preset.bg,
                      borderColor: formData.background_color === preset.bg ? 'hsl(var(--primary))' : 'transparent',
                    }}
                    onClick={() => handleColorSelect(preset.bg, preset.font)}
                    title={preset.label}
                  >
                    <span className="text-[8px] font-bold block" style={{ color: preset.font }}>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bg_color" className="text-xs">Background Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="bg_color"
                      type="color"
                      value={formData.background_color || DEFAULT_BG_COLOR}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="h-10 w-12 p-1 rounded-xl cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.background_color || DEFAULT_BG_COLOR}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="h-10 rounded-xl flex-1 text-xs font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="font_color" className="text-xs">Font Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="font_color"
                      type="color"
                      value={formData.font_color || DEFAULT_FONT_COLOR}
                      onChange={(e) => setFormData(prev => ({ ...prev, font_color: e.target.value }))}
                      className="h-10 w-12 p-1 rounded-xl cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.font_color || DEFAULT_FONT_COLOR}
                      onChange={(e) => setFormData(prev => ({ ...prev, font_color: e.target.value }))}
                      className="h-10 rounded-xl flex-1 text-xs font-mono"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-3 p-3 rounded-xl border border-dashed flex items-center justify-center gap-3">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <Badge
                  className="text-sm px-4 py-1.5"
                  style={{
                    backgroundColor: formData.background_color || DEFAULT_BG_COLOR,
                    color: formData.font_color || DEFAULT_FONT_COLOR,
                  }}
                >
                  {formData.status_name || "Status Preview"}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-11 flex-1 sm:flex-none" onClick={handleFormSubmit}>
              {isEditing ? "Update Status" : "Add Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SAVE CONFIRMATION DIALOG ── */}
      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!o && !saving) setConfirmOpen(false); }}>
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {isEditing ? "Update" : "Add"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing
                ? <>Are you sure you want to update <strong className="text-foreground">{formData.status_name}</strong>?</>
                : <>Add <strong className="text-foreground">{formData.status_name}</strong> to your lead statuses?</>}
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

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); } }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.status_name}</strong>?
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