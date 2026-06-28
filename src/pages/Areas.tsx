// src/pages/Location/Areas.tsx
import { useState, useEffect, useCallback, useRef } from "react";
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
import { areaService, AreaWithDetails } from "@/services/area.service";
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

type SortKey = "area_name" | "city_name" | "state_name";
type SortDir = "asc" | "desc";

const EMPTY_FORM: Partial<AreaWithDetails> = { area_name: "", city_id: "", pincode: "" };

export default function Areas() {
  /* ── refs ─────────────────────────────────────────────────────── */
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formNameInputRef = useRef<HTMLInputElement>(null);

  /* ── data ─────────────────────────────────────────────────────── */
  const [areas, setAreas] = useState<AreaWithDetails[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filtered, setFiltered] = useState<AreaWithDetails[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("area_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AreaWithDetails | null>(null);

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState<Partial<AreaWithDetails>>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

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
    setCitiesLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) return;
      
      const res = await cityService.getCities(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setCities(res.data);
      } else {
        setCities([]);
      }
    } catch (e: any) {
      console.error("Fetch cities error:", e);
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  /* ── fetch areas ─────────────────────────────────────────────── */
  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      
      const res = await areaService.getAreas(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        const formatted = res.data.map((item: any) => {
          const city = cities.find(c => c.city_id === item.city_id);
          const state = states.find(s => s.state_id === city?.state_id);
          return {
            id: item.area_id,
            area_id: item.area_id,
            area_name: item.area_name,
            city_id: item.city_id,
            city_name: city?.city_name || '',
            state_id: city?.state_id || '',
            state_name: state?.state_name || '',
            pincode: item.pincode || '',
            company_id: item.company_id,
            is_deleted: item.is_deleted,
            c_date: item.c_date
          };
        });
        setAreas(formatted);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch areas", variant: "destructive" });
        setAreas([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setAreas([]);
    } finally {
      setLoading(false);
    }
  }, [cities, states]);

  /* ── load data ────────────────────────────────────────────────── */
  useEffect(() => {
    const loadData = async () => {
      await fetchStates();
      await fetchCities();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!statesLoading && !citiesLoading) {
      fetchAreas();
    }
  }, [statesLoading, citiesLoading, fetchAreas]);

  /* ── filter cities by state for form ─────────────────────────── */
  useEffect(() => {
    if (formData.state_id) {
      const filtered = cities.filter(c => c.state_id === formData.state_id);
      setFilteredCities(filtered);
      // Clear city selection if current city is not in filtered list
      if (formData.city_id && !filtered.find(c => c.city_id === formData.city_id)) {
        setFormData(prev => ({ ...prev, city_id: "" }));
      }
    } else {
      setFilteredCities([]);
      setFormData(prev => ({ ...prev, city_id: "" }));
    }
  }, [formData.state_id, cities]);

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...areas];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.area_name?.toLowerCase().includes(q) ||
          a.city_name?.toLowerCase().includes(q) ||
          a.state_name?.toLowerCase().includes(q) ||
          (a.pincode && a.pincode.includes(q))
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "area_name") {
        va = (a.area_name || "").toLowerCase();
        vb = (b.area_name || "").toLowerCase();
      } else if (sortKey === "city_name") {
        va = (a.city_name || "").toLowerCase();
        vb = (b.city_name || "").toLowerCase();
      } else {
        va = (a.state_name || "").toLowerCase();
        vb = (b.state_name || "").toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [areas, search, sortKey, sortDir]);

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
    setTimeout(() => {
      formNameInputRef.current?.focus();
    }, 100);
  };

  const openEdit = (a: AreaWithDetails) => {
    setFormData({
      area_id: a.area_id,
      area_name: a.area_name,
      city_id: a.city_id,
      state_id: a.state_id,
      pincode: a.pincode || ''
    });
    setIsEditing(true);
    setFormError("");
    setFormOpen(true);
    setTimeout(() => {
      formNameInputRef.current?.focus();
    }, 100);
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.state_id) {
      setFormError("Please select a state.");
      return;
    }
    if (!formData.city_id) {
      setFormError("Please select a city.");
      return;
    }
    if (!formData.area_name?.trim()) {
      setFormError("Area name is required.");
      return;
    }
    setFormError("");
    setFormOpen(false);
    setConfirmOpen(true);
  };

  /* ── Handle Enter key ──────────────────────────────────────────── */
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFormSubmit();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  /* ── confirmed → API call ─────────────────────────────────────── */
  const handleConfirmed = async () => {
    setSaving(true);
    try {
      let res;
      if (isEditing && formData.area_id) {
        res = await areaService.updateArea({
          area_id: formData.area_id,
          area_name: formData.area_name!.trim(),
          city_id: formData.city_id,
          pincode: formData.pincode?.trim() || ''
        });
      } else {
        res = await areaService.addArea({
          company_id: getCompanyId(),
          city_id: formData.city_id,
          area_name: formData.area_name!.trim(),
          pincode: formData.pincode?.trim() || ''
        });
      }

      if (res.status === "success") {
        toast({ title: "Success", description: isEditing ? "Area updated successfully" : "Area added successfully" });
        setConfirmOpen(false);
        await fetchAreas();
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
  const askDelete = (a: AreaWithDetails) => {
    setDeleteTarget(a);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.area_id) return;
    setDeleting(true);
    try {
      const res = await areaService.deleteArea(deleteTarget.area_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Area deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchAreas();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  /* ── options for selects ──────────────────────────────────────── */
  const stateOptions = states.map(state => ({
    value: state.state_id || '',
    label: state.state_name
  }));

  const cityOptions = filteredCities.map(city => ({
    value: city.city_id || '',
    label: city.city_name
  }));

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <MainLayout title="Area Master" subtitle="Manage neighborhoods & areas">
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by area, city, state or pincode…"
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
              {filtered.length} {filtered.length === 1 ? "area" : "areas"}
            </Badge>
            <Button onClick={openAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Area
            </Button>
          </div>
        </div>

        {/* skeleton */}
        {loading || statesLoading || citiesLoading ? (
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
              {search ? "No areas match your search" : "No areas added yet"}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first area
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
                        City <SortIcon col="city_name" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("area_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Area Name <SortIcon col="area_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">Pincode</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((a, idx) => (
                    <tr key={a.area_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">{a.state_name || "—"}</td>
                      <td className="px-4 py-3">{a.city_name || "—"}</td>
                      <td className="px-4 py-3 font-medium">{a.area_name}</td>
                      <td className="px-4 py-3">
                        {a.pincode ? (
                          <Badge variant="outline" className="rounded-md font-mono text-xs">
                            {a.pincode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                            onClick={() => openEdit(a)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(a)}
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
              {filtered.map((a, idx) => (
                <div key={a.area_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{a.area_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.city_name}, {a.state_name}
                    </p>
                    {a.pincode && (
                      <p className="text-xs text-muted-foreground mt-0.5">Pincode: {a.pincode}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(a)}
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
        <DialogContent className="sm:max-w-md rounded-2xl" onKeyDown={handleFormKeyDown}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Area" : "Add New Area"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the area details below." : "Fill in the details to add a new area."}
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
                    setFormData((p) => ({ ...p, state_id: v, city_id: "" }));
                    if (formError) setFormError("");
                  }}
                  placeholder="Search and select state..."
                  disabled={statesLoading}
                />
              </div>
            </div>

            <div>
              <Label>
                City <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1.5">
                <SearchableSelect
                  options={cityOptions}
                  value={formData.city_id || ''}
                  onChange={(v) => {
                    setFormData((p) => ({ ...p, city_id: v }));
                    if (formError) setFormError("");
                  }}
                  placeholder={formData.state_id ? "Search and select city..." : "Select state first"}
                  disabled={!formData.state_id || citiesLoading}
                />
              </div>
              {formError && !formData.city_id && formData.state_id && (
                <p className="text-xs text-destructive mt-1.5">{formError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="area_name">
                Area Name <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={formNameInputRef}
                id="area_name"
                value={formData.area_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, area_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                onKeyDown={handleFormKeyDown}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Andheri East"
                autoFocus
              />
              {formError && formData.city_id && (
                <p className="text-xs text-destructive mt-1.5">{formError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="pincode">Pincode <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Input
                id="pincode"
                value={formData.pincode || ""}
                onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                onKeyDown={handleFormKeyDown}
                className="h-11 rounded-xl mt-1.5 font-mono"
                placeholder="e.g. 400093"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">Enter 6-digit postal code</p>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to submit
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl h-11 flex-1 sm:flex-none" onClick={handleFormSubmit}>
              {isEditing ? "Update Area" : "Add Area"}
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
                ? <>Are you sure you want to update <strong className="text-foreground">{formData.area_name}</strong>?</>
                : <>Add <strong className="text-foreground">{formData.area_name}</strong> to the selected city?</>}
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
            <AlertDialogTitle>Delete Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.area_name}</strong>?
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