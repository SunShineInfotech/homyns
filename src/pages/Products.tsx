// src/pages/Masters/Products.tsx
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
import { productService, Product } from "@/services/product.service";
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

type SortKey = "product_name" | "category_name" | "price";
type SortDir = "asc" | "desc";

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("product_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await productService.getProducts(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        // Convert price strings to numbers
        const formattedData = res.data.map((p: any) => ({
          ...p,
          price: parseFloat(p.price) || 0,
          height: parseFloat(p.height) || 0,
          width: parseFloat(p.width) || 0,
          depth: parseFloat(p.depth) || 0,
          length: parseFloat(p.length) || 0,
          gst_percent: parseFloat(p.gst_percent) || 0,
          sort_order: parseInt(p.sort_order) || 0,
        }));
        setProducts(formattedData);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch products", variant: "destructive" });
        setProducts([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.product_name?.toLowerCase().includes(q) ||
          p.category_name?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "product_name") {
        va = (a.product_name || "").toLowerCase();
        vb = (b.product_name || "").toLowerCase();
      } else if (sortKey === "category_name") {
        va = (a.category_name || "").toLowerCase();
        vb = (b.category_name || "").toLowerCase();
      } else {
        va = String(a.price || 0);
        vb = String(b.price || 0);
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [products, search, sortKey, sortDir]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    navigate("/products/form");
  };

  const handleEdit = (id: string) => {
    navigate(`/products/form/${id}`);
  };

  const askDelete = (p: Product) => {
    setDeleteTarget(p);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.product_id) return;
    setDeleting(true);
    try {
      const res = await productService.deleteProduct(deleteTarget.product_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Product deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchProducts();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const getQtyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'Fixed': 'Fixed',
      'ByHWD': 'H × W × D',
      'ByHWL': 'H × W × L'
    };
    return labels[type] || type;
  };

  return (
    <MainLayout title="Products" subtitle="Manage product catalog">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
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
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </Badge>
            <Button onClick={handleAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Product
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
              {search ? "No products match your search" : "No products added yet"}
            </p>
            {!search && (
              <Button onClick={handleAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first product
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
                      onClick={() => toggleSort("product_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Product Name <SortIcon col="product_name" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("category_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Category <SortIcon col="category_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qty Type</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
                    <th
                      className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("price")}
                    >
                      <span className="flex items-center justify-end gap-1.5">
                        Price <SortIcon col="price" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((p, idx) => (
                    <tr key={p.product_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{p.product_name}</td>
                      <td className="px-4 py-3">{p.category_name || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="rounded-md">
                          {getQtyTypeLabel(p.qty_type || 'Fixed')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{Number(p.current_stock || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })}</td>
                      <td className="px-4 py-3 text-right">
                        ₹{p.price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                            onClick={() => handleEdit(p.product_id!)}
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
                <div key={p.product_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.product_name}</p>
                    <p className="text-xs text-muted-foreground">{p.category_name || "—"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{getQtyTypeLabel(p.qty_type || 'Fixed')}</Badge>
                      <span className="text-xs font-medium">₹{p.price?.toFixed(2) || '0.00'}</span>
                      <span className="text-xs text-muted-foreground">Stock: {Number(p.current_stock || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 })}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                      onClick={() => handleEdit(p.product_id!)}
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
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.product_name}</strong>?
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
