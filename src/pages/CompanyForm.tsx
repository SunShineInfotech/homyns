// src/pages/Settings/CompanyForm.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { companyService, Company } from "@/services/company.service";
import { ArrowLeft, Save, Loader2, Upload, X, Building2, Phone, Mail, MapPin, Calendar, CreditCard, Globe } from "lucide-react";

const EMPTY_FORM: Partial<Company> = {
  company_name: "",
  company_code: "",
  address: "",
  phone: "",
  phone2: "",
  whatsapp_number: "",
  email: "",
  gst_number: "",
  company_expiry_date: "",
  website: "",
};

interface UserData {
  emp_id: string;
  name: string;
  login_code: string;
  email: string;
  phone1: string;
  phone2: string;
  profile_image: string | null;
  access_pages: string[];
}

export default function CompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isAddMode = !id;

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Company>>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string>("");
  const [accessDenied, setAccessDenied] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://sunshineproduct.in/interior_designer/v1_api/';

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  const getUserData = (): UserData | null => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        return JSON.parse(raw);
      }
      return null;
    } catch { /* ignore */ }
    return null;
  };

  // Check if user is admin (emp_id 1 or 2)
  useEffect(() => {
    const companyId = getCompanyId();
    setUserCompanyId(companyId);

    const user = getUserData();
    
    const admin = user?.emp_id === "1" || user?.emp_id === "2";
    setIsAdminUser(admin);
  }, []);

  useEffect(() => {
    // Handle Add Mode
    if (isAddMode) {
      // Check if admin can add
    
      setLoading(false);
      return;
    }

    // Handle Edit Mode
    if (isEditMode && id) {
      const fetchCompany = async () => {
        setLoading(true);
        try {
          const companyId = getCompanyId();
          if (!companyId) {
            toast({ title: "Error", description: "Company not found", variant: "destructive" });
            navigate("/company");
            return;
          }

          // If not admin and trying to edit other company, redirect
        

          const response = await companyService.getCompany(id);
          console.log("Company fetch response:", response);
          
          if (response.status === "success" && response.data) {
            setFormData({
              company_id: response.data.company_id,
              company_name: response.data.company_name || "",
              company_code: response.data.company_code || "",
              address: response.data.address || "",
              phone: response.data.phone || "",
              phone2: response.data.phone2 || "",
              whatsapp_number: response.data.whatsapp_number || "",
              email: response.data.email || "",
              gst_number: response.data.gst_number || "",
              company_expiry_date: response.data.company_expiry_date || "",
              website: response.data.website || "",
            });
            if (response.data.logo) {
              setExistingImage(response.data.logo);
            }
          } else {
            toast({ 
              title: "Error", 
              description: response.message || "Failed to fetch company details", 
              variant: "destructive" 
            });
            navigate("/company");
          }
        } catch (e: any) {
          console.error("Fetch error:", e);
          toast({ 
            title: "Error", 
            description: e?.response?.data?.message || e?.message || "Something went wrong", 
            variant: "destructive" 
          });
          navigate("/company");
        } finally {
          setLoading(false);
        }
      };
      fetchCompany();
    }
  }, [id, isEditMode, isAddMode, isAdminUser, navigate]);

  useEffect(() => {
    if (!loading && !accessDenied && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [loading, accessDenied]);

  // Image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const validateAndSetImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return false;
    }
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

    if (!formData.company_name?.trim()) {
      setFormError("Company name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (!formData.company_code?.trim()) {
      setFormError("Company code is required.");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', isEditMode ? '2' : '1');
      formDataToSend.append('company_name', formData.company_name!.trim());
      formDataToSend.append('company_code', formData.company_code!.trim().toUpperCase());
      formDataToSend.append('address', formData.address?.trim() || '');
      formDataToSend.append('phone', formData.phone?.trim() || '');
      formDataToSend.append('phone2', formData.phone2?.trim() || '');
      formDataToSend.append('whatsapp_number', formData.whatsapp_number?.trim() || '');
      formDataToSend.append('email', formData.email?.trim() || '');
      formDataToSend.append('gst_number', formData.gst_number?.trim() || '');
      formDataToSend.append('company_expiry_date', formData.company_expiry_date || '');
      formDataToSend.append('website', formData.website?.trim() || '');

      if (isEditMode && id) {
        formDataToSend.append('company_id', id);
      }

      // Append image if new image is selected
      if (imageFile) {
        formDataToSend.append('logo', imageFile);
      }

      let res;
      if (isEditMode && id) {
        res = await companyService.updateCompany(formDataToSend);
      } else {
        res = await companyService.addCompany(formDataToSend);
      }

      if (res.status === "success") {
        toast({ 
          title: "Success", 
          description: isEditMode ? "Company updated successfully" : "Company added successfully" 
        });
        navigate("/company");
      } else {
        toast({ 
          title: "Error", 
          description: res.message || "Operation failed", 
          variant: "destructive" 
        });
      }
    } catch (e: any) {
      console.error("Submit error:", e);
      toast({ 
        title: "Error", 
        description: e?.response?.data?.message || e?.message || "Something went wrong", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/company");
  };

  // Show loading state
  if (loading) {
    return (
      <MainLayout title={isEditMode ? "Edit Company" : "Add Company"} subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Show access denied - this will auto-navigate after a moment
  if (accessDenied) {
    return (
      <MainLayout title="Access Denied" subtitle="You don't have permission">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <X className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-center max-w-sm">
            You don't have permission to {isAddMode ? 'add' : 'edit'} this company.
            Redirecting back...
          </p>
        </div>
      </MainLayout>
    );
  }

  const title = isEditMode ? "Edit Company" : "Add Company";
  const subtitle = isEditMode ? "Update company information" : "Add new company";
  const imageUrl = imagePreview || (existingImage ? `${API_URL}../uploadfiles/company/${existingImage}` : "");

  return (
    <MainLayout title={title} subtitle={subtitle}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
      
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            {/* Company Name & Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={nameInputRef}
                    id="company_name"
                    value={formData.company_name || ""}
                    onChange={(e) => { setFormData((p) => ({ ...p, company_name: e.target.value })); if (formError) setFormError(""); }}
                    className="h-11 rounded-xl pl-10"
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company_code">
                  Company Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="company_code"
                  value={formData.company_code || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, company_code: e.target.value.toUpperCase() }))}
                  className="h-11 rounded-xl mt-1.5 font-mono"
                  placeholder="e.g. HOMYNS"
                  required
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone 1</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="h-11 rounded-xl pl-10"
                    placeholder="Enter primary phone"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone2">Phone 2</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone2"
                    value={formData.phone2 || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, phone2: e.target.value }))}
                    className="h-11 rounded-xl pl-10"
                    placeholder="Enter alternate phone"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, whatsapp_number: e.target.value }))}
                  className="h-11 rounded-xl pl-10"
                  placeholder="Enter WhatsApp number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="h-11 rounded-xl pl-10"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* GST, Expiry & Website */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="gst_number">GST Number</Label>
                <div className="relative mt-1.5">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gst_number"
                    value={formData.gst_number || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, gst_number: e.target.value.toUpperCase() }))}
                    className="h-11 rounded-xl pl-10 font-mono"
                    placeholder="Enter GST number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="company_expiry_date">Company Expiry Date</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company_expiry_date"
                    type="date"
                    value={formData.company_expiry_date || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, company_expiry_date: e.target.value }))}
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={formData.website || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                    className="h-11 rounded-xl pl-10"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  className="min-h-[80px] rounded-xl pl-10 resize-y"
                  placeholder="Enter company address"
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <Label>Company Logo</Label>
              <div className="mt-1.5">
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Company Logo"
                      className="h-32 w-32 object-cover rounded-xl border"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors shadow-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    ref={dropZoneRef}
                    className={`
                      h-40 w-full rounded-xl border-2 border-dashed 
                      flex flex-col items-center justify-center 
                      transition-all duration-200 cursor-pointer
                      ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted-foreground/25 bg-muted/10 hover:bg-muted/20'}
                    `}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    {isDragging ? (
                      <>
                        <Building2 className="h-12 w-12 text-primary animate-bounce" />
                        <p className="text-sm font-medium text-primary mt-2">Drop your logo here</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground mt-2">Drag & drop your logo here</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">or click to browse</p>
                        <p className="text-xs text-muted-foreground/40 mt-2">JPG, PNG, WEBP • Max 5MB</p>
                      </>
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    {imageUrl ? "Change Logo" : "Browse Files"}
                  </Button>
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="rounded-xl h-11 px-6 gap-2" disabled={saving}>
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> {isEditMode ? "Update Company" : "Add Company"}</>
              )}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl h-11 px-6" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}