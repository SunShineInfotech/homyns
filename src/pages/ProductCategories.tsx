// src/pages/Masters/ProductCategories.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
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
import { productCategoryService, ProductCategory } from "@/services/product-category.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  FolderTree,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
} from "lucide-react";

type SortKey = "category_name" | "sort_order";
type SortDir = "asc" | "desc";

export default function ProductCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filtered, setFiltered] = useState<ProductCategory[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("category_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);
  
  // Image popup states
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; name: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const API_URL = import.meta.env.VITE_API_URL || 'https://sunshineproduct.in/interior_designer/v1_api/';

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await productCategoryService.getCategories(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch categories", variant: "destructive" });
        setCategories([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let list = [...categories];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.category_name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "category_name") {
        va = (a.category_name || "").toLowerCase();
        vb = (b.category_name || "").toLowerCase();
      } else {
        va = String(a.sort_order || 0);
        vb = String(b.sort_order || 0);
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [categories, search, sortKey, sortDir]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    navigate("/categories/form");
  };

  const handleEdit = (id: string) => {
    navigate(`/categories/form/${id}`);
  };

  const askDelete = (c: ProductCategory) => {
    setDeleteTarget(c);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.category_id) return;
    setDeleting(true);
    try {
      const res = await productCategoryService.deleteCategory(deleteTarget.category_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Category deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchCategories();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Image popup handlers
  const openImagePopup = (imageSrc: string, imageName: string) => {
    setSelectedImage({ src: imageSrc, name: imageName });
    setZoomLevel(1);
    setRotation(0);
    setDragOffset({ x: 0, y: 0 });
    setImagePopupOpen(true);
  };

  const closeImagePopup = () => {
    setImagePopupOpen(false);
    setSelectedImage(null);
    setZoomLevel(1);
    setRotation(0);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
    setDragOffset({ x: 0, y: 0 });
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragOffset({
      x: dragOffset.x + dx,
      y: dragOffset.y + dy,
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <MainLayout title="Product Categories" subtitle="Manage product categories">
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
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
              {filtered.length} {filtered.length === 1 ? "category" : "categories"}
            </Badge>
            <Button onClick={handleAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Category
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
              <FolderTree className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No categories match your search" : "No categories added yet"}
            </p>
            {!search && (
              <Button onClick={handleAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first category
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
                      onClick={() => toggleSort("category_name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Category Name <SortIcon col="category_name" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Image</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th
                      className="px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer select-none w-24"
                      onClick={() => toggleSort("sort_order")}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Sort <SortIcon col="sort_order" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((c, idx) => (
                    <tr key={c.category_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{c.category_name}</td>
                      <td className="px-4 py-3">
                        {c.category_image ? (
                          <img 
                            src={`${API_URL}../uploadfiles/product_category/${c.category_image}`} 
                            alt={c.category_name}
                            className="h-12 w-12 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImagePopup(`${API_URL}../uploadfiles/product_category/${c.category_image}`, c.category_name)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <FolderTree className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">
                        {c.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="rounded-md font-mono">
                          {c.sort_order || 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                            onClick={() => handleEdit(c.category_id!)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(c)}
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
              {filtered.map((c, idx) => (
                <div key={c.category_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {c.category_image ? (
                        <img 
                          src={`${API_URL}../uploadfiles/product_category/${c.category_image}`} 
                          alt={c.category_name}
                          className="h-10 w-10 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openImagePopup(`${API_URL}../uploadfiles/product_category/${c.category_image}`, c.category_name)}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <FolderTree className="h-5 w-5 text-muted-foreground" />
                      )}
                      <p className="font-semibold truncate">{c.category_name}</p>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">Sort: {c.sort_order || 0}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                      onClick={() => handleEdit(c.category_id!)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); }}}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.category_name}</strong>?
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

      {/* Image Popup Dialog */}
      <Dialog open={imagePopupOpen} onOpenChange={closeImagePopup}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none rounded-2xl overflow-hidden">
          <DialogHeader className="absolute top-4 left-4 z-10">
            <DialogTitle className="text-white text-sm font-medium truncate max-w-[200px] md:max-w-[400px]">
              {selectedImage?.name || "Image"}
            </DialogTitle>
          </DialogHeader>

          {/* Close button */}
          <button
            onClick={closeImagePopup}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image container with zoom and pan */}
          <div 
            className="flex items-center justify-center w-full h-[85vh] overflow-hidden cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {selectedImage && (
              <img
                src={selectedImage.src}
                alt={selectedImage.name}
                className="select-none transition-transform duration-200 ease-out"
                style={{
                  transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                  maxWidth: '90%',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-xl p-2 border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-white hover:bg-white/10 hover:text-white"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-white/70 text-xs font-medium min-w-[40px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-white hover:bg-white/10 hover:text-white"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-white/10" />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-white hover:bg-white/10 hover:text-white"
              onClick={handleRotate}
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-white hover:bg-white/10 hover:text-white"
              onClick={handleReset}
              title="Reset"
            >
              <Move className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-white/10" />
            
            <span className="text-white/50 text-xs px-2">
              Drag to pan • Scroll to zoom
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}