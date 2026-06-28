// src/pages/Masters/RawMaterialForm.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { rawMaterialService, RawMaterial } from "@/services/raw-material.service";
import { unitService, Unit } from "@/services/unit.service";
import { brandService, Brand } from "@/services/brand.service";
import { rmTypeService, RawMaterialType } from "@/services/rm-type.service";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const EMPTY_FORM: Partial<RawMaterial> = {
  rm_name: "",
  rm_type_id: "",
  unit_id: "",
  brand_id: "",
  color_code: "",
  description: "",
  current_stock: 0,
  min_stock_alert: 0,
  cost_price: 0,
  status: "Active",
};

export default function RawMaterialForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes("/view/");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<Partial<RawMaterial>>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Master data for dropdowns
  const [rmTypes, setRmTypes] = useState<RawMaterialType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Add new dialog states
  const [addTypeDialog, setAddTypeDialog] = useState(false);
  const [addUnitDialog, setAddUnitDialog] = useState(false);
  const [addBrandDialog, setAddBrandDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCode, setNewBrandCode] = useState("");
  const [addingNew, setAddingNew] = useState(false);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  // Fetch master data
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

        const [typesRes, unitsRes, brandsRes] = await Promise.all([
          rmTypeService.getRawMaterialTypes(companyId),
          unitService.getUnits(companyId),
          brandService.getBrands(companyId),
        ]);

        let types: RawMaterialType[] = [];
        let unitsList: Unit[] = [];
        let brandsList: Brand[] = [];

        if (typesRes.status === "success" && typesRes.data) {
          types = typesRes.data;
          setRmTypes(types);
        }
        if (unitsRes.status === "success" && unitsRes.data) {
          unitsList = unitsRes.data;
          setUnits(unitsList);
        }
        if (brandsRes.status === "success" && brandsRes.data) {
          brandsList = brandsRes.data;
          setBrands(brandsList);
        }

        // Set default values for dropdowns when only one option exists
        if (!isEditMode && !isViewMode) {
          const newFormData: Partial<RawMaterial> = { ...formData };
          
          if (types.length === 1 && types[0].rm_type_id) {
            newFormData.rm_type_id = types[0].rm_type_id;
          }
          if (unitsList.length === 1 && unitsList[0].unit_id) {
            newFormData.unit_id = unitsList[0].unit_id;
          }
          if (brandsList.length === 1 && brandsList[0].brand_id) {
            newFormData.brand_id = brandsList[0].brand_id;
          }
          
          setFormData(newFormData);
        }

      } catch (e: any) {
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

  // Fetch material data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchMaterial = async () => {
        setLoading(true);
        try {
          const companyId = getCompanyId();
          if (!companyId) {
            toast({
              title: "Error",
              description: "Company not found",
              variant: "destructive",
            });
            navigate("/raw-materials");
            return;
          }

          const response = await rawMaterialService.getRawMaterials(companyId);
          if (response.status === "success" && response.data) {
            const material = response.data.find((m) => m.rm_id === id);
            if (material) {
              setFormData({
                rm_id: material.rm_id,
                rm_name: material.rm_name,
                rm_type_id: material.rm_type_id || "",
                unit_id: material.unit_id || "",
                brand_id: material.brand_id || "",
                color_code: material.color_code || "",
                description: material.description || "",
                current_stock: material.current_stock || 0,
                min_stock_alert: material.min_stock_alert || 0,
                cost_price: material.cost_price || 0,
                status: material.status || "Active",
              });
            } else {
              toast({
                title: "Error",
                description: "Material not found",
                variant: "destructive",
              });
              navigate("/raw-materials");
            }
          }
        } catch (e: any) {
          toast({
            title: "Error",
            description: e?.response?.data?.message || "Something went wrong",
            variant: "destructive",
          });
          navigate("/raw-materials");
        } finally {
          setLoading(false);
        }
      };
      fetchMaterial();
    }
  }, [id, isEditMode, navigate]);

  // Focus on name input
  useEffect(() => {
    if (!loading && !loadingMasters && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [loading, loadingMasters]);

  // Handle add new type
  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast({ title: "Error", description: "Type name is required", variant: "destructive" });
      return;
    }

    setAddingNew(true);
    try {
      const companyId = getCompanyId();
      const res = await rmTypeService.addRawMaterialType({
        company_id: companyId,
        rm_type_name: newTypeName.trim(),
      });

      if (res.status === "success") {
        toast({ title: "Success", description: "New type added successfully" });
        setNewTypeName("");
        setAddTypeDialog(false);
        // Refresh types list
        const updatedRes = await rmTypeService.getRawMaterialTypes(companyId);
        if (updatedRes.status === "success" && updatedRes.data) {
          setRmTypes(updatedRes.data);
          // Auto-select the new type
          const newType = updatedRes.data.find(t => t.rm_type_name === newTypeName.trim());
          if (newType?.rm_type_id) {
            setFormData((p) => ({ ...p, rm_type_id: newType.rm_type_id }));
          }
        }
      } else {
        toast({ title: "Error", description: res.message || "Failed to add type", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setAddingNew(false);
    }
  };

  // Handle add new unit
  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      toast({ title: "Error", description: "Unit name is required", variant: "destructive" });
      return;
    }

    setAddingNew(true);
    try {
      const companyId = getCompanyId();
      const res = await unitService.addUnit({
        company_id: companyId,
        unit_name: newUnitName.trim(),
      });

      if (res.status === "success") {
        toast({ title: "Success", description: "New unit added successfully" });
        setNewUnitName("");
        setAddUnitDialog(false);
        // Refresh units list
        const updatedRes = await unitService.getUnits(companyId);
        if (updatedRes.status === "success" && updatedRes.data) {
          setUnits(updatedRes.data);
          // Auto-select the new unit
          const newUnit = updatedRes.data.find(u => u.unit_name === newUnitName.trim());
          if (newUnit?.unit_id) {
            setFormData((p) => ({ ...p, unit_id: newUnit.unit_id }));
          }
        }
      } else {
        toast({ title: "Error", description: res.message || "Failed to add unit", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setAddingNew(false);
    }
  };

  // Handle add new brand
  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      toast({ title: "Error", description: "Brand name is required", variant: "destructive" });
      return;
    }

    setAddingNew(true);
    try {
      const companyId = getCompanyId();
      const res = await brandService.addBrand({
        company_id: companyId,
        brand_name: newBrandName.trim(),
        brand_code: newBrandCode.trim() || '',
      });

      if (res.status === "success") {
        toast({ title: "Success", description: "New brand added successfully" });
        setNewBrandName("");
        setNewBrandCode("");
        setAddBrandDialog(false);
        // Refresh brands list
        const updatedRes = await brandService.getBrands(companyId);
        if (updatedRes.status === "success" && updatedRes.data) {
          setBrands(updatedRes.data);
          // Auto-select the new brand
          const newBrand = updatedRes.data.find(b => b.brand_name === newBrandName.trim());
          if (newBrand?.brand_id) {
            setFormData((p) => ({ ...p, brand_id: newBrand.brand_id }));
          }
        }
      } else {
        toast({ title: "Error", description: res.message || "Failed to add brand", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setAddingNew(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rm_name?.trim()) {
      setFormError("Material name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (!formData.rm_type_id) {
      setFormError("Material type is required.");
      return;
    }
    if (!formData.unit_id) {
      setFormError("Unit is required.");
      return;
    }
    if (!formData.brand_id) {
      setFormError("Brand is required.");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      let res;
      if (isEditMode && formData.rm_id) {
        res = await rawMaterialService.updateRawMaterial({
          rm_id: formData.rm_id,
          rm_name: formData.rm_name!.trim(),
          rm_type_id: formData.rm_type_id,
          unit_id: formData.unit_id,
          brand_id: formData.brand_id,
          color_code: formData.color_code || "",
          description: formData.description || "",
          current_stock: Number(formData.current_stock) || 0,
          min_stock_alert: Number(formData.min_stock_alert) || 0,
          cost_price: Number(formData.cost_price) || 0,
          status: formData.status || "Active",
        });
      } else {
        res = await rawMaterialService.addRawMaterial({
          company_id: getCompanyId(),
          rm_name: formData.rm_name!.trim(),
          rm_type_id: formData.rm_type_id,
          unit_id: formData.unit_id,
          brand_id: formData.brand_id,
          color_code: formData.color_code || "",
          description: formData.description || "",
          current_stock: Number(formData.current_stock) || 0,
          min_stock_alert: Number(formData.min_stock_alert) || 0,
          cost_price: Number(formData.cost_price) || 0,
          status: formData.status || "Active",
        });
      }

      if (res.status === "success") {
        toast({
          title: "Success",
          description: isEditMode
            ? "Material updated successfully"
            : "Material added successfully",
        });
        navigate("/raw-materials");
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
    navigate("/raw-materials");
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

  // Prepare options for dropdowns with "Add New" option
  const rmTypeOptions = [
    ...rmTypes.map((t) => ({
      value: t.rm_type_id || "",
      label: t.rm_type_name,
    })),
    { value: "__add_new__", label: "+ Add New Type" },
  ];

  const unitOptions = [
    ...units.map((u) => ({
      value: u.unit_id || "",
      label: u.unit_name,
    })),
    { value: "__add_new__", label: "+ Add New Unit" },
  ];

  const brandOptions = [
    ...brands.map((b) => ({
      value: b.brand_id || "",
      label: b.brand_name,
    })),
    { value: "__add_new__", label: "+ Add New Brand" },
  ];

  // Handle select change with add new option
  const handleTypeSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddTypeDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, rm_type_id: value }));
    if (formError) setFormError("");
  };

  const handleUnitSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddUnitDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, unit_id: value }));
    if (formError) setFormError("");
  };

  const handleBrandSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddBrandDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, brand_id: value }));
    if (formError) setFormError("");
  };

  if (loading || loadingMasters) {
    return (
      <MainLayout
        title={isEditMode ? "Edit Raw Material" : "Add Raw Material"}
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const title = isViewMode
    ? "View Raw Material"
    : isEditMode
      ? "Edit Raw Material"
      : "Add Raw Material";
  const subtitle = isViewMode
    ? "View material details"
    : isEditMode
      ? "Update material information"
      : "Add new material to catalog";

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
    

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rm_name">
                  Material Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={nameInputRef}
                  id="rm_name"
                  value={formData.rm_name || ""}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, rm_name: e.target.value }));
                    if (formError) setFormError("");
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="e.g. Cement, Paint, etc."
                  disabled={isViewMode}
                  required
                />
                {formError && !formData.rm_name && (
                  <p className="text-xs text-destructive mt-1.5">{formError}</p>
                )}
              </div>

              <div>
                <Label htmlFor="rm_type_id">
                  Material Type <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={rmTypeOptions}
                    value={formData.rm_type_id || ""}
                    onChange={handleTypeSelect}
                    placeholder="Search and select type..."
                    disabled={isViewMode || loadingMasters}
                  />
                  {rmTypeOptions.length === 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Only one type available. Auto-selected.
                    </p>
                  )}
                </div>
                {formError && !formData.rm_type_id && (
                  <p className="text-xs text-destructive mt-1.5">{formError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="unit_id">
                  Unit <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={unitOptions}
                    value={formData.unit_id || ""}
                    onChange={handleUnitSelect}
                    placeholder="Search and select unit..."
                    disabled={isViewMode || loadingMasters}
                  />
                  {unitOptions.length === 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Only one unit available. Auto-selected.
                    </p>
                  )}
                </div>
                {formError && !formData.unit_id && (
                  <p className="text-xs text-destructive mt-1.5">{formError}</p>
                )}
              </div>

              <div>
                <Label htmlFor="brand_id">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={brandOptions}
                    value={formData.brand_id || ""}
                    onChange={handleBrandSelect}
                    placeholder="Search and select brand..."
                    disabled={isViewMode || loadingMasters}
                  />
                  {brandOptions.length === 2 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Only one brand available. Auto-selected.
                    </p>
                  )}
                </div>
                {formError && !formData.brand_id && (
                  <p className="text-xs text-destructive mt-1.5">{formError}</p>
                )}
              </div>

              <div>
                <Label htmlFor="color_code">Color Code</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    type="color"
                    value={formData.color_code || "#000000"}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        color_code: e.target.value,
                      }))
                    }
                    className="w-16 h-11 p-1 rounded-xl"
                    disabled={isViewMode}
                  />
                  <Input
                    type="text"
                    value={formData.color_code || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        color_code: e.target.value,
                      }))
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="#FF0000 or Red"
                    className="flex-1 h-11 rounded-xl"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                ref={descriptionTextareaRef}
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
                className="min-h-[100px] rounded-xl mt-1.5 resize-y"
                placeholder="Brief description of the material..."
                disabled={isViewMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current_stock">Current Stock</Label>
                <Input
                  id="current_stock"
                  type="number"
                  value={formData.current_stock || 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      current_stock: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  min="0"
                  step="0.01"
                  disabled={isViewMode}
                />
              </div>

              <div>
                <Label htmlFor="min_stock_alert">Min Stock Alert</Label>
                <Input
                  id="min_stock_alert"
                  type="number"
                  value={formData.min_stock_alert || 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      min_stock_alert: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  min="0"
                  step="0.01"
                  disabled={isViewMode}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when stock falls below this
                </p>
              </div>

              <div>
                <Label htmlFor="cost_price">Cost Price</Label>
                <Input
                  id="cost_price"
                  type="number"
                  value={formData.cost_price || 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      cost_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  min="0"
                  step="0.01"
                  disabled={isViewMode}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
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

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
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
                    {isEditMode ? "Update Material" : "Add Material"}
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

      {/* Add Type Dialog */}
      <Dialog open={addTypeDialog} onOpenChange={setAddTypeDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Type</DialogTitle>
            <DialogDescription>
              Enter the name for the new raw material type.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newTypeName">Type Name</Label>
            <Input
              id="newTypeName"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddType();
                }
              }}
              className="h-11 rounded-xl mt-1.5"
              placeholder="e.g. Fixed, Consumable, etc."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddTypeDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddType}
              disabled={addingNew}
            >
              {addingNew ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                "Add Type"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Unit Dialog */}
      <Dialog open={addUnitDialog} onOpenChange={setAddUnitDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>
              Enter the name for the new unit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newUnitName">Unit Name</Label>
            <Input
              id="newUnitName"
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUnit();
                }
              }}
              className="h-11 rounded-xl mt-1.5"
              placeholder="e.g. Box, Bag, CFT, etc."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddUnitDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddUnit}
              disabled={addingNew}
            >
              {addingNew ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                "Add Unit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Brand Dialog */}
      <Dialog open={addBrandDialog} onOpenChange={setAddBrandDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription>
              Enter the details for the new brand.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="newBrandName">Brand Name <span className="text-destructive">*</span></Label>
              <Input
                id="newBrandName"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddBrand();
                  }
                }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Asian Paints, Berger, etc."
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="newBrandCode">Brand Code <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Input
                id="newBrandCode"
                value={newBrandCode}
                onChange={(e) => setNewBrandCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddBrand();
                  }
                }}
                className="h-11 rounded-xl mt-1.5 font-mono"
                placeholder="e.g. AP, BGR"
                maxLength={20}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddBrandDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddBrand}
              disabled={addingNew}
            >
              {addingNew ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                "Add Brand"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}