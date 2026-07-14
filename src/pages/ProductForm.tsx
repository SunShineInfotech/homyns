// src/pages/Masters/ProductForm.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "@/hooks/use-toast";
import {
  productService,
  Product,
  ProductDetail,
} from "@/services/product.service";
import {
  productCategoryService,
  ProductCategory,
} from "@/services/product-category.service";
import {
  rawMaterialService,
  RawMaterial,
} from "@/services/raw-material.service";
import { unitService, Unit } from "@/services/unit.service";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  Ruler,
} from "lucide-react";

const QTY_TYPES = [
  { value: "Fixed", label: "Fixed" },
  { value: "ByHW", label: "By Height × Width" },
  { value: "ByHWD", label: "By Height × Width × Depth" },
  { value: "ByHWL", label: "By Height × Width × Length" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const EMPTY_DETAIL = { rm_id: "", rm_qty: 0, remark: "" };

interface ExtendedProductDetail extends ProductDetail {
  rm_name?: string;
  rm_type_name?: string;
  unit_name?: string;
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes("/view/");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    product_name: "",
    category_id: "",
    qty_type: "Fixed",
    height: 0,
    width: 0,
    depth: 0,
    length: 0,
    dimension_unit_id: "",
    price: 0,
    gst_percent: 0,
    description: "",
    status: "Active",
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  const [productDetails, setProductDetails] = useState<ExtendedProductDetail[]>(
    [],
  );
  const [newDetail, setNewDetail] = useState<ExtendedProductDetail>({
    ...EMPTY_DETAIL,
  });
  const [detailError, setDetailError] = useState("");

  // Add Category Dialog states
  const [addCategoryDialog, setAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [newCategoryImagePreview, setNewCategoryImagePreview] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://sunshineproduct.in/interior_designer/v1_api/";

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
    return "";
  };

  // ── Fetch masters ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const companyId = getCompanyId();
        if (!companyId) {
          toast({
            title: "Error",
            description: "Company not found",
            variant: "destructive",
          });
          return;
        }
        const [catRes, matRes, unitRes] = await Promise.all([
          productCategoryService.getCategories(companyId),
          rawMaterialService.getRawMaterials(companyId),
          unitService.getUnits(companyId),
        ]);
        if (catRes.status === "success" && catRes.data)
          setCategories(catRes.data);
        if (matRes.status === "success" && matRes.data)
          setRawMaterials(matRes.data);
        if (unitRes.status === "success" && unitRes.data)
          setUnits(unitRes.data);

        // Set default category if only one exists and in add mode
        if (!isEditMode && !isViewMode && catRes.data?.length === 1) {
          setFormData((p) => ({
            ...p,
            category_id: catRes.data[0].category_id || "",
          }));
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load master data",
          variant: "destructive",
        });
      } finally {
        setLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  // ── Fetch product (edit) ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const companyId = getCompanyId();
        if (!companyId) {
          toast({
            title: "Error",
            description: "Company not found",
            variant: "destructive",
          });
          navigate("/products");
          return;
        }
        const response = await productService.getProducts(companyId);
        if (response.status === "success" && response.data) {
          const product = response.data.find((p) => p.product_id === id);
          if (product) {
            setFormData({
              product_id: product.product_id,
              product_name: product.product_name,
              category_id: product.category_id || "",
              qty_type: product.qty_type || "Fixed",
              height: product.height || 0,
              width: product.width || 0,
              depth: product.depth || 0,
              length: product.length || 0,
              dimension_unit_id: product.dimension_unit_id || "",
              price: product.price || 0,
              gst_percent: product.gst_percent || 0,
              description: product.description || "",
              status: product.status || "Active",
            });
            if (product.image) setExistingImage(product.image);
            if (product.product_details?.length) {
              setProductDetails(
                product.product_details.map((d) => ({
                  ...d,
                  rm_name: d.rm_name || "",
                  rm_type_name: (d as any).rm_type_name || "",
                  unit_name: (d as any).unit_name || "",
                })),
              );
            }
          } else {
            toast({
              title: "Error",
              description: "Product not found",
              variant: "destructive",
            });
            navigate("/products");
          }
        }
      } catch (e: any) {
        toast({
          title: "Error",
          description: e?.response?.data?.message || "Something went wrong",
          variant: "destructive",
        });
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    if (!loading && !loadingMasters) nameInputRef.current?.focus();
  }, [loading, loadingMasters]);

  // ── Image helpers ──────────────────────────────────────────────────────────
  const validateAndSetImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image must be under 5 MB",
        variant: "destructive",
      });
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetImage(file);
  };

  // ── Raw material helpers ───────────────────────────────────────────────────
  const selectedMaterial = rawMaterials.find(
    (r) => r.rm_id === newDetail.rm_id,
  );
  const isMaterialAlreadyAdded =
    !!newDetail.rm_id &&
    productDetails.some((d) => d.rm_id === newDetail.rm_id);
  const isAddDisabled =
    !newDetail.rm_id ||
    !newDetail.rm_qty ||
    newDetail.rm_qty <= 0 ||
    isMaterialAlreadyAdded;
  const hasUnaddedSelection = !!newDetail.rm_id && !isMaterialAlreadyAdded;

  const handleAddDetail = () => {
    if (!newDetail.rm_id) {
      setDetailError("Please select a raw material");
      return;
    }
    if (!newDetail.rm_qty || newDetail.rm_qty <= 0) {
      setDetailError("Please enter a valid quantity");
      return;
    }
    if (isMaterialAlreadyAdded) {
      setDetailError("This raw material is already added");
      return;
    }

    setProductDetails((prev) => [
      ...prev,
      {
        ...newDetail,
        rm_name: selectedMaterial?.rm_name || "",
        rm_type_name: (selectedMaterial as any)?.rm_type_name || "",
        unit_name: (selectedMaterial as any)?.unit_name || "",
      },
    ]);
    setNewDetail({ ...EMPTY_DETAIL });
    setDetailError("");
  };

  const handleRemoveDetail = (index: number) =>
    setProductDetails((prev) => prev.filter((_, i) => i !== index));

  // ── Add Category ──────────────────────────────────────────────────────────
  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Image must be under 5 MB", variant: "destructive" });
        return;
      }
      setNewCategoryImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setNewCategoryImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCategoryImage = () => {
    setNewCategoryImage(null);
    setNewCategoryImagePreview("");
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    setAddingCategory(true);
    try {
      const companyId = getCompanyId();
      const fd = new FormData();
      fd.append("type", "1");
      fd.append("company_id", companyId);
      fd.append("category_name", newCategoryName.trim());
      fd.append("description", newCategoryDescription.trim() || "");
      if (newCategoryImage) fd.append("category_image", newCategoryImage);

      const res = await productCategoryService.addCategory(fd);

      if (res.status === "success") {
        toast({
          title: "Success",
          description: "New category added successfully",
        });
        setNewCategoryName("");
        setNewCategoryDescription("");
        setNewCategoryImage(null);
        setNewCategoryImagePreview("");
        setAddCategoryDialog(false);
        // Refresh categories list
        const updatedRes =
          await productCategoryService.getCategories(companyId);
        if (updatedRes.status === "success" && updatedRes.data) {
          setCategories(updatedRes.data);
          // Auto-select the new category
          const newCategory = updatedRes.data.find(
            (c) => c.category_name === newCategoryName.trim(),
          );
          if (newCategory?.category_id) {
            setFormData((p) => ({
              ...p,
              category_id: newCategory.category_id,
            }));
          }
        }
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add category",
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
      setAddingCategory(false);
    }
  };

  // ── Options ────────────────────────────────────────────────────────────────
  const categoryOptions = [
    ...categories.map((c) => ({
      value: c.category_id || "",
      label: c.category_name,
    })),
    { value: "__add_new__", label: "+ Add New Category" },
  ];

  const materialOptions = rawMaterials.map((r) => ({
    value: r.rm_id || "",
    label: `${r.rm_name}${(r as any).brand_name ? ` (${(r as any).brand_name})` : ""}`,
  }));
  const unitOptions = units.map((u) => ({
    value: u.unit_id || "",
    label: u.unit_name,
  }));

  const handleCategorySelect = (value: string) => {
    if (value === "__add_new__") {
      setAddCategoryDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, category_id: value }));
    if (formError) setFormError("");
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name?.trim()) {
      setFormError("Product name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (!formData.category_id) {
      setFormError("Category is required.");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setFormError("Price must be greater than 0.");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append("type", isEditMode ? "2" : "1");
      fd.append("company_id", getCompanyId());
      fd.append("product_name", formData.product_name!.trim());
      fd.append("category_id", formData.category_id || "");
      fd.append("qty_type", formData.qty_type || "Fixed");
      fd.append("height", String(formData.height || 0));
      fd.append("width", String(formData.width || 0));
      fd.append("depth", String(formData.depth || 0));
      fd.append("length", String(formData.length || 0));
      fd.append("dimension_unit_id", formData.dimension_unit_id || "");
      fd.append("price", String(formData.price || 0));
      fd.append("gst_percent", String(formData.gst_percent || 0));
      fd.append("description", formData.description?.trim() || "");
      fd.append("status", formData.status || "Active");
      if (isEditMode && formData.product_id)
        fd.append("product_id", formData.product_id);
      if (imageFile) fd.append("product_image", imageFile);
      fd.append("product_details", JSON.stringify(productDetails));

      const res =
        isEditMode && formData.product_id
          ? await productService.updateProduct(fd)
          : await productService.addProduct(fd);

      if (res.status === "success") {
        toast({
          title: "Success",
          description: isEditMode
            ? "Product updated successfully"
            : "Product added successfully",
        });
        navigate("/products");
      } else {
        toast({
          title: "Error",
          description: res.message || "Operation failed",
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
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/products");

  // ── Derived UI flags ───────────────────────────────────────────────────────
  const showDimensions = formData.qty_type !== "Fixed";
  const showDepth = formData.qty_type === "ByHWD";
  const showLength = formData.qty_type === "ByHWL";
  const showHeightWidth = formData.qty_type === "ByHW";
  const imageUrl =
    imagePreview ||
    (existingImage ? `${API_URL}../uploadfiles/product/${existingImage}` : "");
  const title = isViewMode
    ? "View Product"
    : isEditMode
      ? "Edit Product"
      : "Add Product";
  const subtitle = isViewMode
    ? "View product details"
    : isEditMode
      ? "Update product information"
      : "Add new product";

  if (loading || loadingMasters) {
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
          {/* ── Basic Info Card ── */}
          <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b pb-3">
              Basic Information
            </h3>

            {/* Name + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="product_name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={nameInputRef}
                  id="product_name"
                  value={formData.product_name || ""}
                  onChange={(e) => {
                    setFormData((p) => ({
                      ...p,
                      product_name: e.target.value,
                    }));
                    if (formError) setFormError("");
                  }}
                  className="h-11 rounded-xl"
                  placeholder="e.g. Premium Wood Table"
                  disabled={isViewMode}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category_id">
                  Category <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <SearchableSelect
                    options={categoryOptions}
                    value={formData.category_id || ""}
                    onChange={handleCategorySelect}
                    placeholder="Search and select category..."
                    disabled={isViewMode || loadingMasters}
                  />
                  {categoryOptions.length === 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Only one category available. Auto-selected.
                    </p>
                  )}
                </div>
                {formError && !formData.category_id && (
                  <p className="text-xs text-destructive mt-1.5">{formError}</p>
                )}
              </div>
            </div>

            {/* Qty Type */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>
                  Quantity Type <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Ruler className="h-3.5 w-3.5" />
                  <span>
                    (All dimensions are in <strong>Feet</strong>)
                  </span>
                </div>
              </div>
              <SearchableSelect
                options={QTY_TYPES}
                value={formData.qty_type || "Fixed"}
                onChange={(v) => setFormData((p) => ({ ...p, qty_type: v }))}
                placeholder="Select quantity type..."
                disabled={isViewMode}
              />
            </div>

            {/* Dimensions */}
            {showDimensions && (
              <>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-dashed">
                  <Ruler className="h-3.5 w-3.5 text-primary" />
                  <strong className="text-foreground">
                    All measurements are in Feet
                  </strong>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl border border-dashed">
                  <div className="space-y-1.5">
                    <Label htmlFor="height">Height (ft)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height || 0}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          height: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-10 rounded-xl"
                      min="0"
                      step="0.01"
                      disabled={isViewMode}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="width">Width (ft)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={formData.width || 0}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          width: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="h-10 rounded-xl"
                      min="0"
                      step="0.01"
                      disabled={isViewMode}
                      placeholder="0.00"
                    />
                  </div>
                  {showDepth && (
                    <div className="space-y-1.5">
                      <Label htmlFor="depth">Depth (ft)</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={formData.depth || 0}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            depth: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="h-10 rounded-xl"
                        min="0"
                        step="0.01"
                        disabled={isViewMode}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  {showLength && (
                    <div className="space-y-1.5">
                      <Label htmlFor="length">Length (ft)</Label>
                      <Input
                        id="length"
                        type="number"
                        value={formData.length || 0}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            length: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="h-10 rounded-xl"
                        min="0"
                        step="0.01"
                        disabled={isViewMode}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                  {showHeightWidth && (
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <SearchableSelect
                        options={unitOptions}
                        value={formData.dimension_unit_id || ""}
                        onChange={(v) =>
                          setFormData((p) => ({ ...p, dimension_unit_id: v }))
                        }
                        placeholder="Select unit..."
                        disabled={isViewMode}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Price + GST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">
                  Price <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    ₹
                  </span>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price || 0}
                    onChange={(e) => {
                      setFormData((p) => ({
                        ...p,
                        price: parseFloat(e.target.value) || 0,
                      }));
                      if (formError) setFormError("");
                    }}
                    className="h-11 rounded-xl pl-7"
                    min="0"
                    step="0.01"
                    disabled={isViewMode}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gst_percent">GST %</Label>
                <div className="relative">
                  <Input
                    id="gst_percent"
                    type="number"
                    value={formData.gst_percent || 0}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        gst_percent: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="h-11 rounded-xl pr-8"
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={isViewMode}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Description - Optional */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                className="min-h-[80px] rounded-xl resize-y"
                placeholder="Product description (optional)"
                disabled={isViewMode}
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <SearchableSelect
                options={STATUS_OPTIONS}
                value={formData.status || "Active"}
                onChange={(v) => setFormData((p) => ({ ...p, status: v }))}
                placeholder="Select status..."
                disabled={isViewMode}
              />
            </div>

            {/* Image - Optional */}
            <div className="space-y-1.5">
              <Label>
                Product Image <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              {imageUrl ? (
                <div className="flex items-start gap-4 p-3 bg-muted/30 rounded-xl border">
                  <div className="relative shrink-0">
                    <img
                      src={imageUrl}
                      alt="Product"
                      className="h-24 w-24 object-cover rounded-xl border shadow-sm"
                    />
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
                      <p className="text-xs text-muted-foreground">
                        {(imageFile.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg gap-1.5 mt-1 w-fit"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Change Image
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
                      ${isDragging
                        ? "border-primary bg-primary/8 scale-[1.01]"
                        : "border-muted-foreground/25 bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/40"
                      }
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
                        <p className="text-sm font-semibold text-primary">
                          Drop image here
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-9 w-9 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Drag & drop or{" "}
                          <span className="text-primary underline underline-offset-2">
                            browse
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground/50">
                          JPG, PNG, WEBP · Max 5 MB <span className="text-muted-foreground/30">(optional)</span>
                        </p>
                      </>
                    )}
                  </div>
                )
              )}
              {!isViewMode && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              )}
            </div>
          </div>

          {/* ── Raw Materials Card ── */}
          {!isViewMode && (
            <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 border-b pb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-semibold">Raw Materials Used</h3>
                {productDetails.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {productDetails.length}
                  </Badge>
                )}
              </div>

              {/* ── Add row ── */}
              <div className="p-4 bg-muted/20 rounded-xl border border-dashed space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Add Raw Material
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5 space-y-1">
                    <Label className="text-xs">Raw Material</Label>
                    <SearchableSelect
                      options={materialOptions}
                      value={newDetail.rm_id || ""}
                      onChange={(v) => {
                        setNewDetail((p) => ({ ...p, rm_id: v }));
                        setDetailError("");
                      }}
                      placeholder="Select material..."
                      disabled={false}
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-xs">
                      Quantity
                      {selectedMaterial &&
                        (selectedMaterial as any).unit_name && (
                          <span className="ml-1 text-muted-foreground font-normal">
                            ({(selectedMaterial as any).unit_name})
                          </span>
                        )}
                    </Label>
                    <Input
                      type="number"
                      value={newDetail.rm_qty || ""}
                      onChange={(e) => {
                        setNewDetail((p) => ({
                          ...p,
                          rm_qty: parseFloat(e.target.value) || 0,
                        }));
                        setDetailError("");
                      }}
                      className="h-10 rounded-xl"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={!newDetail.rm_id}
                    />
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <Label className="text-xs">Remark (optional)</Label>
                    <Input
                      value={newDetail.remark || ""}
                      onChange={(e) =>
                        setNewDetail((p) => ({ ...p, remark: e.target.value }))
                      }
                      className="h-10 rounded-xl"
                      placeholder="e.g. Grade A"
                      disabled={!newDetail.rm_id}
                    />
                  </div>
                </div>

                {isMaterialAlreadyAdded && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    This material is already in the list
                  </div>
                )}
                {detailError && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {detailError}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleAddDetail}
                  disabled={isAddDisabled}
                  size="sm"
                  className="rounded-xl gap-1.5 h-9"
                >
                  <Plus className="h-4 w-4" />
                  Add to List
                </Button>

                {hasUnaddedSelection && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      You have a material selected but not added. Please click{" "}
                      <strong>Add to List</strong> to include it, or clear the
                      selection before saving.
                    </span>
                  </div>
                )}
              </div>

              {/* ── Materials list ── */}
              {productDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No raw materials added
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Select a material above and click "Add to List"
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden sm:block overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-10">
                            #
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                            Raw Material
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                            Type
                          </th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-32">
                            Qty
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                            Remark
                          </th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-14">
                            Remove
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {productDetails.map((detail, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {detail.rm_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {detail.rm_type_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono text-sm">
                                {detail.rm_qty}
                              </span>
                              {detail.unit_name && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  {detail.unit_name}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-sm">
                              {detail.remark || (
                                <span className="text-muted-foreground/40">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveDetail(idx)}
                                title="Remove"
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
                    {productDetails.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="font-medium text-sm leading-snug truncate">
                            {detail.rm_name || "—"}
                          </p>
                          {detail.rm_type_name && (
                            <p className="text-xs text-muted-foreground">
                              {detail.rm_type_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="rounded-md text-xs px-1.5 py-0"
                            >
                              {detail.rm_qty} {detail.unit_name || ""}
                            </Badge>
                            {detail.remark && (
                              <span className="text-xs text-muted-foreground truncate">
                                {detail.remark}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => handleRemoveDetail(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {productDetails.length} material
                    {productDetails.length !== 1 ? "s" : ""} will be saved with
                    this product
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── View mode: raw materials ── */}
          {isViewMode && productDetails.length > 0 && (
            <div className="bg-card rounded-2xl border p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-base font-semibold">Raw Materials Used</h3>
                <Badge variant="secondary" className="rounded-full text-xs">
                  {productDetails.length}
                </Badge>
              </div>

              <div className="hidden sm:block overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground w-10">
                        #
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Raw Material
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-32">
                        Qty
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        Remark
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productDetails.map((detail, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {detail.rm_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {detail.rm_type_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-sm">
                            {detail.rm_qty}
                          </span>
                          {detail.unit_name && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {detail.unit_name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {detail.remark || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sm:hidden space-y-2">
                {productDetails.map((detail, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border bg-muted/20"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="font-medium text-sm leading-snug">
                        {detail.rm_name || "—"}
                      </p>
                      {detail.rm_type_name && (
                        <p className="text-xs text-muted-foreground">
                          {detail.rm_type_name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="rounded-md text-xs px-1.5 py-0"
                        >
                          {detail.rm_qty} {detail.unit_name || ""}
                        </Badge>
                        {detail.remark && (
                          <span className="text-xs text-muted-foreground">
                            {detail.remark}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Form error ── */}
          {formError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* ── Actions ── */}
          {!isViewMode ? (
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-11 px-6 flex-1 sm:flex-none"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl h-11 px-6 gap-2 flex-1 sm:flex-none"
                disabled={saving || hasUnaddedSelection}
                title={
                  hasUnaddedSelection
                    ? "Add or clear the selected material before saving"
                    : undefined
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEditMode ? "Update Product" : "Add Product"}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-11 px-6 gap-2"
              onClick={handleCancel}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>
          )}
        </form>
      </div>

      {/* ── Add Category Dialog ── */}
      <Dialog open={addCategoryDialog} onOpenChange={setAddCategoryDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Enter the details for the new product category.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="newCategoryName">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Furniture, Lighting, etc."
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="newCategoryDescription">
                Description{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="newCategoryDescription"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="min-h-[80px] rounded-xl mt-1.5 resize-y"
                placeholder="Brief description of the category..."
              />
            </div>
            <div>
              <Label>
                Category Image{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (Required)
                </span>
              </Label>
              {newCategoryImagePreview ? (
                <div className="flex items-start gap-4 p-3 bg-muted/30 rounded-xl border mt-1.5">
                  <div className="relative shrink-0">
                    <img
                      src={newCategoryImagePreview}
                      alt="New category"
                      className="h-20 w-20 object-cover rounded-xl border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveCategoryImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <p className="text-sm font-medium text-foreground">
                      {newCategoryImage?.name || "Image"}
                    </p>
                    {newCategoryImage && (
                      <p className="text-xs text-muted-foreground">
                        {(newCategoryImage.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="h-24 w-full rounded-xl border-2 border-dashed border-muted-foreground/25 
                    flex flex-col items-center justify-center gap-0.5 cursor-pointer
                    hover:bg-muted/20 hover:border-muted-foreground/40 transition-all duration-200 mt-1.5"
                  onClick={() => document.getElementById("categoryImageInput")?.click()}
                >
                  <Upload className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">Click to upload image</p>
                  <p className="text-[10px] text-muted-foreground/50">JPG, PNG, WEBP · Max 5 MB</p>
                </div>
              )}
              <input
                id="categoryImageInput"
                type="file"
                accept="image/*"
                onChange={handleCategoryImageChange}
                className="hidden"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => {
                setAddCategoryDialog(false);
                setNewCategoryName("");
                setNewCategoryDescription("");
                setNewCategoryImage(null);
                setNewCategoryImagePreview("");
              }}
              disabled={addingCategory}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddCategory}
              disabled={addingCategory}
            >
              {addingCategory ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}