// src/pages/Location/Cities.tsx
import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { cityService, City } from "@/services/city.service";
import { stateService, State } from "@/services/state.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";

type SortKey = "city_name" | "state_name";
type SortDir = "asc" | "desc";

interface CityWithState extends City {
  state_name?: string;
  id?: string;
}

const EMPTY_FORM: Partial<CityWithState> = { city_name: "", state_id: "" };

export default function Cities() {
  /* ── data ─────────────────────────────────────────────────────── */
  const [cities, setCities] = useState<CityWithState[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [filtered, setFiltered] = useState<CityWithState[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("city_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CityWithState | null>(null);

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState<Partial<CityWithState>>(EMPTY_FORM);
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

  /* ── fetch states ─────────────────────────────────────────────── */
  const fetchStates = useCallback(async () => {
    setStatesLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await stateService.getStates(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setStates(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch states", variant: "destructive" });
        setStates([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setStates([]);
    } finally {
      setStatesLoading(false);
    }
  }, []);

  /* ── fetch cities ─────────────────────────────────────────────── */
  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await cityService.getCities(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        // Map state names to cities
        const formatted = res.data.map((item: any) => {
          const state = states.find(s => s.state_id === item.state_id);
          return {
            id: item.city_id,
            city_id: item.city_id,
            city_name: item.city_name,
            state_id: item.state_id,
            state_name: state?.state_name || '',
            company_id: item.company_id,
            is_deleted: item.is_deleted,
            c_date: item.c_date
          };
        });
        setCities(formatted);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch cities", variant: "destructive" });
        setCities([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, [states]);

  /* ── load data ────────────────────────────────────────────────── */
  useEffect(() => {
    const loadData = async () => {
      await fetchStates();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!statesLoading) {
      fetchCities();
    }
  }, [statesLoading, fetchCities]);

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...cities];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.city_name?.toLowerCase().includes(q) ||
          c.state_name?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "city_name") {
        va = (a.city_name || "").toLowerCase();
        vb = (b.city_name || "").toLowerCase();
      } else {
        va = (a.state_name || "").toLowerCase();
        vb = (b.state_name || "").toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [cities, search, sortKey, sortDir]);

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

  const openEdit = (c: CityWithState) => {
    setFormData({
      city_id: c.city_id,
      city_name: c.city_name,
      state_id: c.state_id
    });
    setIsEditing(true);
    setFormError("");
    setFormOpen(true);
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.state_id) {
      setFormError("Please select a state.");
      return;
    }
    if (!formData.city_name?.trim()) {
      setFormError("City name is required.");
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
      if (isEditing && formData.city_id) {
        res = await cityService.updateCity({
          city_id: formData.city_id,
          city_name: formData.city_name!.trim(),
          state_id: formData.state_id
        });
      } else {
        res = await cityService.addCity({
          company_id: getCompanyId(),
          state_id: formData.state_id,
          city_name: formData.city_name!.trim()
        });
      }

      if (res.status === "success") {
        toast({ title: "Success", description: isEditing ? "City updated successfully" : "City added successfully" });
        setConfirmOpen(false);
        await fetchCities();
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
  const askDelete = (c: CityWithState) => {
    setDeleteTarget(c);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.city_id) return;
    setDeleting(true);
    try {
      const res = await cityService.deleteCity(deleteTarget.city_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "City deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchCities();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  /* ── state options for SearchableSelect ───────────────────────── */
  const stateOptions = states.map(state => ({
    value: state.state_id || '',
    label: state.state_name
  }));

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <MainLayout title="City Master" subtitle="Manage cities">
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city or state…"
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
              {filtered.length} {filtered.length === 1 ? "city" : "cities"}
            </Badge>
            <Button onClick={openAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add City
            </Button>
          </div>
        </div>

        {/* skeleton */}
        {loading || statesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>

        /* empty */
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No cities match your search" : "No cities added yet"}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first city
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
                      onClick={() => toggleSort("state_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        State <SortIcon col="state_name" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("city_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        City Name <SortIcon col="city_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((c, idx) => (
                    <tr key={c.city_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{c.state_name || "—"}</td>
                      <td className="px-4 py-3">{c.city_name}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(c)}
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
              {filtered.map((c, idx) => (
                <div key={c.city_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.city_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.state_name || "—"}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(c)}
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
            <DialogTitle>{isEditing ? "Edit City" : "Add New City"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the city details below." : "Fill in the details to add a new city."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>
                State <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  options={stateOptions}
                  value={formData.state_id || ''}
                  onChange={(v) => {
                    setFormData((p) => ({ ...p, state_id: v }));
                    if (formError) setFormError("");
                  }}
                  placeholder="Search and select state..."
                  disabled={statesLoading}
                />
              </div>
              {formError && !formData.state_id && (
                <p className="text-xs text-destructive mt-1.5">{formError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="city_name">
                City Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city_name"
                value={formData.city_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, city_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Mumbai"
                autoFocus
              />
              {formError && formData.state_id && (
                <p className="text-xs text-destructive mt-1.5">{formError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-11 flex-1 sm:flex-none" onClick={handleFormSubmit}>
              {isEditing ? "Update City" : "Add City"}
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
                ? <>Are you sure you want to update <strong className="text-foreground">{formData.city_name}</strong>?</>
                : <>Add <strong className="text-foreground">{formData.city_name}</strong> to the selected state?</>}
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
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.city_name}</strong>?
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