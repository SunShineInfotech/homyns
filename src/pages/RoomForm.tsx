// src/pages/Masters/RoomForm.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { roomService, Room, RoomProduct } from "@/services/room.service";
import { productService, Product } from "@/services/product.service";
import { ArrowLeft, Save, Loader2, Upload, X, Image as ImageIcon, Plus, Package, AlertCircle, CheckCircle2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const EMPTY_PRODUCT: RoomProduct = {
  product_id: "",
  product_name: "",
  default_qty: 1,
  sort_order: 0,
};

export default function RoomForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes("/view/");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Room>>({
    room_name: "",
    description: "",
    sort_order: 0,
    status: "Active",
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [roomProducts, setRoomProducts] = useState<RoomProduct[]>([]);
  const [newProduct, setNewProduct] = useState<RoomProduct>({ ...EMPTY_PRODUCT });
  const [productError, setProductError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "https://sunshineproduct.in/interior_designer/v1_api/";

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const companyId = getCompanyId();
        if (!companyId) {
          toast({ title: "Error", description: "Company not found", variant: "destructive" });
          return;
        }
        const res = await productService.getProducts(companyId);
        if (res.status === "success" && res.data) {
          setProducts(res.data);
        }
      } catch (e: any) {
        toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Fetch room data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchRoom = async () => {
        setLoading(true);
        try {
          const companyId = getCompanyId();
          if (!companyId) {
            toast({ title: "Error", description: "Company not found", variant: "destructive" });
            navigate("/rooms");
            return;
          }

          const response = await roomService.getRooms(companyId);
          if (response.status === "success" && response.data) {
            const room = response.data.find((r) => r.room_id === id);
            if (room) {
              setFormData({
                room_id: room.room_id,
                room_name: room.room_name,
                description: room.description || "",
                sort_order: room.sort_order || 0,
                status: room.status || "Active",
              });
              if (room.image) {
                setExistingImage(room.image);
              }
              if (room.room_products && room.room_products.length > 0) {
                setRoomProducts(room.room_products);
              }
            } else {
              toast({ title: "Error", description: "Room not found", variant: "destructive" });
              navigate("/rooms");
            }
          }
        } catch (e: any) {
          toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
          navigate("/rooms");
        } finally {
          setLoading(false);
        }
      };
      fetchRoom();
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    if (!loading && !loadingProducts && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [loading, loadingProducts]);

  // Image helpers
  const validateAndSetImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be under 5 MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetImage(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setExistingImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetImage(file);
  };

  // Product helpers
  const selectedProduct = products.find((p) => p.product_id === newProduct.product_id);
  const isProductAlreadyAdded = !!newProduct.product_id && roomProducts.some((p) => p.product_id === newProduct.product_id);
  const isAddDisabled = !newProduct.product_id || !newProduct.default_qty || newProduct.default_qty <= 0 || isProductAlreadyAdded;
  const hasUnaddedSelection = !!newProduct.product_id && !isProductAlreadyAdded;

  const handleAddProduct = () => {
    if (!newProduct.product_id) { setProductError("Please select a product"); return; }
    if (!newProduct.default_qty || newProduct.default_qty <= 0) { setProductError("Please enter a valid quantity"); return; }
    if (isProductAlreadyAdded) { setProductError("This product is already added"); return; }

    setRoomProducts((prev) => [
      ...prev,
      {
        ...newProduct,
        product_name: selectedProduct?.product_name || "",
        category_name: selectedProduct?.category_name || "",
      },
    ]);
    setNewProduct({ ...EMPTY_PRODUCT });
    setProductError("");
  };

  const handleRemoveProduct = (index: number) =>
    setRoomProducts((prev) => prev.filter((_, i) => i !== index));

  const handleClearProducts = () => {
    setRoomProducts([]);
    setNewProduct({ ...EMPTY_PRODUCT });
    setProductError("");
  };

  // Options
  const productOptions = products.map((p) => ({
    value: p.product_id || "",
    label: `${p.product_name} ${p.category_name ? `(${p.category_name})` : ''}`,
  }));

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.room_name?.trim()) {
      setFormError("Room name is required.");
      nameInputRef.current?.focus();
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("type", isEditMode ? "2" : "1");
      fd.append("company_id", getCompanyId());
      fd.append("room_name", formData.room_name!.trim());
      fd.append("description", formData.description?.trim() || "");
      fd.append("sort_order", String(formData.sort_order || 0));
      fd.append("status", formData.status || "Active");
      if (isEditMode && formData.room_id) fd.append("room_id", formData.room_id);
      if (imageFile) fd.append("room_image", imageFile);
      fd.append("room_products", JSON.stringify(roomProducts));

      const res = isEditMode && formData.room_id
        ? await roomService.updateRoom(fd)
        : await roomService.addRoom(fd);

      if (res.status === "success") {
        toast({
          title: "Success",
          description: isEditMode ? "Room updated successfully" : "Room added successfully",
        });
        navigate("/rooms");
      } else {
        toast({ title: "Error", description: res.message || "Operation failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/rooms");

  const imageUrl = imagePreview || (existingImage ? `${API_URL}../uploadfiles/room/${existingImage}` : "");
  const title = isViewMode ? "View Room" : isEditMode ? "Edit Room" : "Add Room";
  const subtitle = isViewMode ? "View room details" : isEditMode ? "Update room information" : "Add new room";

  if (loading || loadingProducts) {
    return (
      <MainLayout title={title} subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
      

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info Card */}
          <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b pb-3">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="room_name">Room Name <span className="text-destructive">*</span></Label>
                <Input
                  ref={nameInputRef}
                  id="room_name"
                  value={formData.room_name || ""}
                  onChange={(e) => { setFormData((p) => ({ ...p, room_name: e.target.value })); if (formError) setFormError(""); }}
                  className="h-11 rounded-xl"
                  placeholder="e.g. Living Room, Bedroom"
                  disabled={isViewMode}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sort_order">Priority</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                  className="h-11 rounded-xl"
                  min="0"
                  placeholder="0"
                  disabled={isViewMode}
                />
                <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="min-h-[80px] rounded-xl resize-y"
                placeholder="Room description..."
                disabled={isViewMode}
              />
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-1.5">
                <SearchableSelect
                  options={STATUS_OPTIONS}
                  value={formData.status || "Active"}
                  onChange={(v) => setFormData((p) => ({ ...p, status: v }))}
                  placeholder="Select status..."
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label>Room Image</Label>
              {imageUrl ? (
                <div className="flex items-start gap-4 p-3 bg-muted/30 rounded-xl border">
                  <div className="relative shrink-0">
                    <img src={imageUrl} alt="Room" className="h-24 w-24 object-cover rounded-xl border shadow-sm" />
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <p className="text-sm font-medium text-foreground">
                      {imageFile ? imageFile.name : "Current image"}
                    </p>
                    {imageFile && (
                      <p className="text-xs text-muted-foreground">{(imageFile.size / 1024).toFixed(1)} KB</p>
                    )}
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg gap-1.5 mt-1 w-fit"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" /> Change Image
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                !isViewMode && (
                  <div
                    ref={dropZoneRef}
                    className={`
                      h-36 w-full rounded-xl border-2 border-dashed
                      flex flex-col items-center justify-center gap-1.5
                      transition-all duration-200 cursor-pointer select-none
                      ${isDragging ? "border-primary bg-primary/8 scale-[1.01]" : "border-muted-foreground/25 bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/40"}
                    `}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isDragging ? (
                      <>
                        <ImageIcon className="h-10 w-10 text-primary animate-bounce" />
                        <p className="text-sm font-semibold text-primary">Drop image here</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-9 w-9 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Drag & drop or <span className="text-primary underline underline-offset-2">browse</span>
                        </p>
                        <p className="text-xs text-muted-foreground/50">JPG, PNG, WEBP · Max 5 MB</p>
                      </>
                    )}
                  </div>
                )
              )}
              {!isViewMode && (
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              )}
            </div>
          </div>

          {/* Products Card */}
          {!isViewMode && (
            <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-semibold">Products in this Room</h3>
                {roomProducts.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs">{roomProducts.length}</Badge>
                )}
              </div>

              <div className="p-4 bg-muted/20 rounded-xl border border-dashed space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add Product</p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <div className="relative">
                      <SearchableSelect
                        options={productOptions}
                        value={newProduct.product_id || ""}
                        onChange={(v) => {
                          setNewProduct((p) => ({ ...p, product_id: v }));
                          setProductError("");
                        }}
                        placeholder="Select product..."
                      />
                      {newProduct.product_id && (
                        <button
                          type="button"
                          title="Clear selection"
                          onClick={() => { setNewProduct({ ...EMPTY_PRODUCT }); setProductError(""); }}
                          className="absolute right-9 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">Default Qty</Label>
                    <Input
                      type="number"
                      value={newProduct.default_qty || ""}
                      onChange={(e) => {
                        setNewProduct((p) => ({ ...p, default_qty: parseFloat(e.target.value) || 0 }));
                        setProductError("");
                      }}
                      className="h-10 rounded-xl"
                      min="0"
                      step="0.01"
                      placeholder="1.00"
                      disabled={!newProduct.product_id}
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <Input
                      type="number"
                      value={newProduct.sort_order || 0}
                      onChange={(e) => setNewProduct((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                      className="h-10 rounded-xl"
                      min="0"
                      placeholder="0"
                      disabled={!newProduct.product_id}
                    />
                  </div>
                </div>

                {isProductAlreadyAdded && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> This product is already in the list
                  </div>
                )}
                {productError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {productError}
                  </div>
                )}

                <Button type="button" onClick={handleAddProduct} disabled={isAddDisabled} size="sm" className="rounded-xl gap-1.5 h-9">
                  <Plus className="h-4 w-4" /> Add to List
                </Button>

                {hasUnaddedSelection && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>You have a product selected but not added. Please click <strong>Add to List</strong> to include it.</span>
                  </div>
                )}
              </div>

              {roomProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">No products added to this room</p>
                  <p className="text-xs text-muted-foreground/60">Select a product above and click "Add to List"</p>
                </div>
              ) : (
                <>
                  <div className="hidden sm:block overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Product</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Category</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-24">Qty</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-24">Sort</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-14">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {roomProducts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium">{p.product_name || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{p.category_name || "—"}</td>
                            <td className="px-4 py-3 text-center font-mono text-sm">{p.default_qty}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{p.sort_order || 0}</td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveProduct(idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="sm:hidden space-y-2">
                    {roomProducts.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="font-medium text-sm leading-snug">{p.product_name || "—"}</p>
                          {p.category_name && <p className="text-xs text-muted-foreground">{p.category_name}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="rounded-md text-xs px-1.5 py-0">Qty: {p.default_qty}</Badge>
                            <span className="text-xs text-muted-foreground">Sort: {p.sort_order || 0}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => handleRemoveProduct(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {roomProducts.length} product{roomProducts.length !== 1 ? "s" : ""} will be saved with this room
                    </div>
                    <Button type="button" variant="destructive" size="sm" className="rounded-xl gap-1" onClick={handleClearProducts}>
                      <X className="h-3.5 w-3.5" /> Clear All
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* View mode products */}
          {isViewMode && roomProducts.length > 0 && (
            <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-semibold">Products in this Room</h3>
                <Badge variant="secondary" className="rounded-full text-xs">{roomProducts.length}</Badge>
              </div>
              <div className="hidden sm:block overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Product</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Category</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-24">Qty</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-24">Sort</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {roomProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium">{p.product_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.category_name || "—"}</td>
                        <td className="px-4 py-3 text-center font-mono text-sm">{p.default_qty}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{p.sort_order || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden space-y-2">
                {roomProducts.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-medium text-sm leading-snug">{p.product_name || "—"}</p>
                      {p.category_name && <p className="text-xs text-muted-foreground">{p.category_name}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="rounded-md text-xs px-1.5 py-0">Qty: {p.default_qty}</Badge>
                        <span className="text-xs text-muted-foreground">Sort: {p.sort_order || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          {!isViewMode ? (
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <Button type="button" variant="outline" className="rounded-xl h-11 px-6 flex-1 sm:flex-none" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 px-6 gap-2 flex-1 sm:flex-none"
                disabled={saving || hasUnaddedSelection}
                title={hasUnaddedSelection ? "Add or clear the selected product before saving" : undefined}
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> {isEditMode ? "Update Room" : "Add Room"}</>}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6 gap-2" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4" /> Back to List
            </Button>
          )}
        </form>
      </div>
    </MainLayout>
  );
}