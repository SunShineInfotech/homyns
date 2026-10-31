// src/pages/Masters/ProductCategoryForm.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { productCategoryService, ProductCategory } from "@/services/product-category.service";
import { ArrowLeft, Save, Loader2, Upload, X, Image as ImageIcon, FileImage } from "lucide-react";

const EMPTY_FORM: Partial<ProductCategory> = {
  category_name: "",
  description: "",
  sort_order: 0,
  category_image: "",
};

export default function ProductCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes("/view/");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<ProductCategory>>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  // Fetch category data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchCategory = async () => {
        setLoading(true);
        try {
          const companyId = getCompanyId();
          if (!companyId) {
            toast({
              title: "Error",
              description: "Company not found",
              variant: "destructive",
            });
            navigate("/categories");
            return;
          }

          const response = await productCategoryService.getCategories(companyId);
          if (response.status === "success" && response.data) {
            const category = response.data.find((c) => c.category_id === id);
            if (category) {
              setFormData({
                category_id: category.category_id,
                category_name: category.category_name,
                description: category.description || "",
                sort_order: category.sort_order || 0,
                category_image: category.category_image || "",
              });
              if (category.category_image) {
                setExistingImage(category.category_image);
              }
            } else {
              toast({
                title: "Error",
                description: "Category not found",
                variant: "destructive",
              });
              navigate("/categories");
            }
          }
        } catch (e: any) {
          toast({
            title: "Error",
            description: e?.response?.data?.message || "Something went wrong",
            variant: "destructive",
          });
          navigate("/categories");
        } finally {
          setLoading(false);
        }
      };
      fetchCategory();
    }
  }, [id, isEditMode, navigate]);

  // Focus on name input
  useEffect(() => {
    if (!loading && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [loading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const validateAndSetImage = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return false;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size should be less than 5MB", variant: "destructive" });
      return false;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and Drop Handlers
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
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSetImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_name?.trim()) {
      setFormError("Category name is required.");
      nameInputRef.current?.focus();
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', isEditMode ? '2' : '1');
      formDataToSend.append('company_id', getCompanyId());
      formDataToSend.append('category_name', formData.category_name!.trim());
      formDataToSend.append('description', formData.description?.trim() || '');
      formDataToSend.append('sort_order', String(formData.sort_order || 0));
      
      if (isEditMode && formData.category_id) {
        formDataToSend.append('category_id', formData.category_id);
      }

      // Append image if new image is selected
      if (imageFile) {
        formDataToSend.append('category_image', imageFile);
      }

      // If in edit mode and image was removed
      if (isEditMode && !imageFile && !existingImage) {
        formDataToSend.append('remove_image', '1');
      }

      let res;
      if (isEditMode && formData.category_id) {
        res = await productCategoryService.updateCategory(formDataToSend);
      } else {
        res = await productCategoryService.addCategory(formDataToSend);
      }

      if (res.status === "success") {
        toast({
          title: "Success",
          description: isEditMode ? "Category updated successfully" : "Category added successfully",
        });
        navigate("/categories");
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

  const handleCancel = () => {
    navigate("/categories");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        const inputs = Array.from(
          form.querySelectorAll("input, select, textarea"),
        );
        const currentIndex = inputs.indexOf(e.target);
        if (currentIndex < inputs.length - 1) {
          (inputs[currentIndex + 1] as HTMLElement).focus();
        }
      }
    }
  };

  if (loading) {
    return (
      <MainLayout
        title={isEditMode ? "Edit Category" : "Add Category"}
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const title = isViewMode
    ? "View Category"
    : isEditMode
      ? "Edit Category"
      : "Add Category";
  const subtitle = isViewMode
    ? "View category details"
    : isEditMode
      ? "Update category information"
      : "Add new category";

  const imageUrl = imagePreview || (existingImage ? `${API_URL}../uploadfiles/product_category/${existingImage}` : "");

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
      

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <div>
              <Label htmlFor="category_name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={nameInputRef}
                id="category_name"
                value={formData.category_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, category_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                onKeyDown={handleKeyDown}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Furniture, Lighting, etc."
                disabled={isViewMode}
                required
              />
              {formError && (
                <p className="text-xs text-destructive mt-1.5">{formError}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="min-h-[100px] rounded-xl mt-1.5 resize-y"
                placeholder="Brief description of the category..."
                disabled={isViewMode}
              />
            </div>

            <div>
              <Label htmlFor="sort_order">Priority</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order || 0}
                onChange={(e) => setFormData((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                className="h-11 rounded-xl mt-1.5"
                min="0"
                placeholder="0"
                disabled={isViewMode}
              />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
            </div>

            <div>
              <Label>Category Image</Label>
              <div className="mt-1.5">
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Category"
                      className="h-32 w-32 object-cover rounded-xl border"
                    />
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    ref={dropZoneRef}
                    className={`
                      h-40 w-full rounded-xl border-2 border-dashed 
                      flex flex-col items-center justify-center 
                      transition-all duration-200 cursor-pointer
                      ${isDragging 
                        ? 'border-primary bg-primary/10 scale-[1.02]' 
                        : 'border-muted-foreground/25 bg-muted/10 hover:bg-muted/20'
                      }
                      ${isViewMode ? 'cursor-default' : ''}
                    `}
                    onClick={() => !isViewMode && fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isDragging ? (
                      <>
                        <FileImage className="h-12 w-12 text-primary animate-bounce" />
                        <p className="text-sm font-medium text-primary mt-2">Drop your image here</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground mt-2">
                          Drag & drop your image here
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground/40 mt-2">
                          JPG, PNG, WEBP • Max 5MB
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                {!isViewMode && (
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      id="category_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {imageUrl ? "Change Image" : "Browse Files"}
                    </Button>
                    {!imageUrl && (
                      <p className="text-xs text-muted-foreground">
                        or drag and drop
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isViewMode && (
            <div className="flex gap-3">
              <Button
                type="submit"
                className="rounded-xl h-11 px-6 gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />{" "}
                    {isEditMode ? "Update Category" : "Add Category"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-11 px-6"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          )}

          {isViewMode && (
            <Button
              type="button"
              className="rounded-xl h-11 px-6"
              onClick={handleCancel}
            >
              Back to List
            </Button>
          )}
        </form>
      </div>
    </MainLayout>
  );
}