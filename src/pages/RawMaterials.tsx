// src/pages/Masters/RawMaterials.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { rawMaterialService, RawMaterial } from "@/services/raw-material.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
} from "lucide-react";

type SortKey = "rm_name" | "rm_type_name" | "brand_name" | "current_stock";
type SortDir = "asc" | "desc";

export default function RawMaterials() {
  const navigate = useNavigate();

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [filtered, setFiltered] = useState<RawMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rm_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RawMaterial | null>(null);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      
      const res = await rawMaterialService.getRawMaterials(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setMaterials(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch materials", variant: "destructive" });
        setMaterials([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let list = [...materials];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.rm_name?.toLowerCase().includes(q) ||
          m.rm_type_name?.toLowerCase().includes(q) ||
          m.brand_name?.toLowerCase().includes(q) ||
          m.unit_name?.toLowerCase().includes(q) ||
          m.color_code?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "rm_name") {
        va = (a.rm_name || "").toLowerCase();
        vb = (b.rm_name || "").toLowerCase();
      } else if (sortKey === "rm_type_name") {
        va = (a.rm_type_name || "").toLowerCase();
        vb = (b.rm_type_name || "").toLowerCase();
      } else if (sortKey === "brand_name") {
        va = (a.brand_name || "").toLowerCase();
        vb = (b.brand_name || "").toLowerCase();
      } else {
        va = String(a.current_stock || 0);
        vb = String(b.current_stock || 0);
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [materials, search, sortKey, sortDir]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

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

  const handleAdd = () => {
    navigate("/raw-materials/form");
  };

  const handleEdit = (id: string) => {
    navigate(`/raw-materials/form/${id}`);
  };

  const handleView = (id: string) => {
    navigate(`/raw-materials/view/${id}`);
  };

  const askDelete = (m: RawMaterial) => {
    setDeleteTarget(m);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.rm_id) return;
    setDeleting(true);
    try {
      const res = await rawMaterialService.deleteRawMaterial(deleteTarget.rm_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Material deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchMaterials();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout title="Raw Materials" subtitle="Manage the materials catalog">
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, type, brand or color…"
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
              {filtered.length} {filtered.length === 1 ? "material" : "materials"}
            </Badge>
            <Button onClick={handleAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No materials match your search" : "No raw materials added yet"}
            </p>
            {!search && (
              <Button onClick={handleAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first material
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("rm_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Name <SortIcon col="rm_name" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("rm_type_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Type <SortIcon col="rm_type_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Unit</th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("brand_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Brand <SortIcon col="brand_name" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("current_stock")}
                    >
                      <span className="flex items-center justify-end gap-1.5">
                        Stock <SortIcon col="current_stock" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((m, idx) => (
                    <tr key={m.rm_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{m.rm_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="rounded-md">
                          {m.rm_type_name || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{m.unit_name || "—"}</td>
                      <td className="px-4 py-3">{m.brand_name || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge 
                          variant={Number(m.current_stock) <= Number(m.min_stock_alert) ? "destructive" : "secondary"}
                          className="rounded-md"
                        >
                          {m.current_stock}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                            onClick={() => handleEdit(m.rm_id!)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(m)}
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

            <div className="md:hidden space-y-2">
              {filtered.map((m, idx) => (
                <div key={m.rm_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{m.rm_name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <Badge variant="outline" className="text-xs">{m.rm_type_name || "—"}</Badge>
                      {m.brand_name && <span className="text-xs text-muted-foreground">{m.brand_name}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">Stock: {m.current_stock}</span>
                      {m.unit_name && <span className="text-xs text-muted-foreground">Unit: {m.unit_name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                      onClick={() => handleEdit(m.rm_id!)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(m)}
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

      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); }}}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.rm_name}</strong>?
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