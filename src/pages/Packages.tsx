// src/pages/Masters/Packages.tsx
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
import { packageService, Package } from "@/services/package.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package as PackageIcon,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Calendar,
  Users,
} from "lucide-react";

type SortKey = "package_name" | "completion_days" | "status";
type SortDir = "asc" | "desc";

export default function Packages() {
  const navigate = useNavigate();

  const [packages, setPackages] = useState<Package[]>([]);
  const [filtered, setFiltered] = useState<Package[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("package_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await packageService.getPackages(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setPackages(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch packages", variant: "destructive" });
        setPackages([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let list = [...packages];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.package_name?.toLowerCase().includes(q) ||
          p.details?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "package_name") {
        va = (a.package_name || "").toLowerCase();
        vb = (b.package_name || "").toLowerCase();
      } else if (sortKey === "completion_days") {
        va = String(a.completion_days || 0);
        vb = String(b.completion_days || 0);
      } else {
        va = (a.status || "").toLowerCase();
        vb = (b.status || "").toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [packages, search, sortKey, sortDir]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

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
    navigate("/packages/form");
  };

  const handleEdit = (id: string) => {
    navigate(`/packages/form/${id}`);
  };

  const askDelete = (p: Package) => {
    setDeleteTarget(p);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.package_id) return;
    setDeleting(true);
    try {
      const res = await packageService.deletePackage(deleteTarget.package_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Package deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchPackages();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const getRoomCount = (rooms: string) => {
    if (!rooms) return 0;
    return rooms.split(',').filter(r => r.trim()).length;
  };

  return (
    <MainLayout title="Packages" subtitle="Manage project packages">
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
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
              {filtered.length} {filtered.length === 1 ? "package" : "packages"}
            </Badge>
            <Button onClick={handleAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Package
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
              <PackageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No packages match your search" : "No packages added yet"}
            </p>
            {!search && (
              <Button onClick={handleAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first package
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
                      onClick={() => toggleSort("package_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Package Name <SortIcon col="package_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                    <th
                      className="px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("completion_days")}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Days <SortIcon col="completion_days" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rooms</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created By</th>
                    <th
                      className="px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("status")}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Status <SortIcon col="status" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((p, idx) => (
                    <tr key={p.package_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{p.package_name}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                        {p.details || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="rounded-md font-mono">
                          {p.completion_days || 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="secondary" className="rounded-md">
                          {getRoomCount(p.rooms || '')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.created_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={p.status === "Active" ? "success" : "secondary"}
                          className="rounded-md"
                        >
                          {p.status || "Active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                            onClick={() => handleEdit(p.package_id!)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(p)}
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
              {filtered.map((p, idx) => (
                <div key={p.package_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.package_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {p.completion_days || 0} days
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getRoomCount(p.rooms || '')} rooms
                      </Badge>
                      <Badge 
                        variant={p.status === "Active" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {p.status || "Active"}
                      </Badge>
                    </div>
                    {p.details && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{p.details}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                      onClick={() => handleEdit(p.package_id!)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(p)}
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
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.package_name}</strong>?
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