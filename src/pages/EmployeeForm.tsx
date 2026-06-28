// src/pages/Masters/EmployeeForm.tsx
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
import { employeeService, Employee } from "@/services/employee.service";
import { 
  ArrowLeft, Save, Loader2, Upload, X, Image as ImageIcon, 
  Users, Lock, Calendar, Phone, Mail, User, MapPin, CreditCard,
  LayoutDashboard, FilePlus, FileText, UserPlus, Package, Layers,
  DoorOpen, Ruler, Tag, FolderTree, Map, Building2, MapPin as MapPinIcon,
  Settings, UserCircle, Grid, ClipboardList, BarChart3, PhoneCall,AlertCircle  
} from "lucide-react";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// Grouped pages for access_pages
const PAGE_GROUPS = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    pages: [
      { value: "dashboard", label: "Dashboard" },
    ]
  },
  {
    name: "Quotations",
    icon: FileText,
    pages: [
      { value: "create-quotation", label: "Create Quotation" },
      { value: "quotations", label: "Quotation History" },
    ]
  },
  {
    name: "Clients & Leads",
    icon: Users,
    pages: [
      { value: "clients", label: "Clients" },
      { value: "my-leads", label: "My Leads" },
      { value: "all-leads", label: "All Leads" },
      { value: "my-today-followup", label: "My Today Followup" },
      { value: "all-followups", label: "All Followups" },
    ]
  },
  {
    name: "Master Data",
    icon: Grid,
    pages: [
      { value: "employees", label: "Employees" },
      { value: "lead-sources", label: "Lead Sources" },
      { value: "lead-statuses", label: "Lead Status" },
      { value: "units", label: "Units" },
      { value: "brands", label: "Brands" },
      { value: "raw-material-types", label: "Raw Material Types" },
      { value: "raw-materials", label: "Raw Materials" },
      { value: "categories", label: "Categories" },
      { value: "products", label: "Products" },
      { value: "rooms", label: "Rooms" },
      { value: "packages", label: "Packages" },
      { value: "terms", label: "Terms & Conditions" },
    ]
  },
  {
    name: "Location",
    icon: Map,
    pages: [
      { value: "states", label: "State Master" },
      { value: "cities", label: "City Master" },
      { value: "areas", label: "Area Master" },
    ]
  },
  {
    name: "Reports",
    icon: BarChart3,
    pages: [
      { value: "reports-low-stock", label: "Low Raw Material Stock" },
      { value: "reports-work-order", label: "Work Order Status" },
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    pages: [
      { value: "company", label: "Company Settings" },
      { value: "profile", label: "Profile" },
    ]
  },
];

const EMPTY_FORM: Partial<Employee> = {
  login_code: "",
  name: "",
  phone1: "",
  phone2: "",
  email: "",
  gender: "",
  aadhar_card: "",
  pan_card: "",
  address: "",
  joining_date: "",
  birth_date: "",
  access_pages: "",
  status: "Active",
};

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes("/view/");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Partial<Employee>>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Access pages as array for UI
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || 'https://sunshineproduct.in/interior_designer/v1_api/';

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  // Fetch employee data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const fetchEmployee = async () => {
        setLoading(true);
        try {
          const companyId = getCompanyId();
          if (!companyId) {
            toast({ title: "Error", description: "Company not found", variant: "destructive" });
            navigate("/employees");
            return;
          }

          const response = await employeeService.getEmployees(companyId);
          if (response.status === "success" && response.data) {
            const employee = response.data.find((e) => e.emp_id === id);
            if (employee) {
              setFormData({
                emp_id: employee.emp_id,
                login_code: employee.login_code,
                name: employee.name,
                phone1: employee.phone1 || "",
                phone2: employee.phone2 || "",
                email: employee.email || "",
                gender: employee.gender || "",
                aadhar_card: employee.aadhar_card || "",
                pan_card: employee.pan_card || "",
                address: employee.address || "",
                joining_date: employee.joining_date || "",
                birth_date: employee.birth_date || "",
                access_pages: employee.access_pages || "",
                status: employee.status || "Active",
              });
              if (employee.profile_image) {
                setExistingImage(employee.profile_image);
              }
              // Parse access pages
              if (employee.access_pages) {
                setSelectedPages(employee.access_pages.split(',').map((p: string) => p.trim()).filter(Boolean));
              }
            } else {
              toast({ title: "Error", description: "Employee not found", variant: "destructive" });
              navigate("/employees");
            }
          }
        } catch (e: any) {
          toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
          navigate("/employees");
        } finally {
          setLoading(false);
        }
      };
      fetchEmployee();
    }
  }, [id, isEditMode, navigate]);

  useEffect(() => {
    if (!loading && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [loading]);

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

  // Access pages handlers
  const togglePage = (page: string) => {
    setSelectedPages(prev => {
      if (prev.includes(page)) {
        return prev.filter(p => p !== page);
      } else {
        return [...prev, page];
      }
    });
  };

  const toggleAllPagesInGroup = (groupPages: { value: string; label: string }[]) => {
    const groupValues = groupPages.map(p => p.value);
    const allSelected = groupValues.every(v => selectedPages.includes(v));
    
    if (allSelected) {
      setSelectedPages(prev => prev.filter(p => !groupValues.includes(p)));
    } else {
      setSelectedPages(prev => [...prev, ...groupValues.filter(v => !prev.includes(v))]);
    }
  };

  const isGroupFullySelected = (groupPages: { value: string; label: string }[]) => {
    return groupPages.every(p => selectedPages.includes(p.value));
  };

  const isGroupPartiallySelected = (groupPages: { value: string; label: string }[]) => {
    const selected = groupPages.filter(p => selectedPages.includes(p.value));
    return selected.length > 0 && selected.length < groupPages.length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim()) {
      setFormError("Employee name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (!formData.login_code?.trim()) {
      setFormError("Login code is required.");
      return;
    }

    // Validate password for new employee
    if (!isEditMode) {
      if (!password || password.length < 4) {
        setFormError("Password must be at least 4 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
    }

    setFormError("");
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', isEditMode ? '2' : '1');
      formDataToSend.append('company_id', getCompanyId());
      formDataToSend.append('login_code', formData.login_code!.trim());
      formDataToSend.append('name', formData.name!.trim());
      formDataToSend.append('phone1', formData.phone1?.trim() || '');
      formDataToSend.append('phone2', formData.phone2?.trim() || '');
      formDataToSend.append('email', formData.email?.trim() || '');
      formDataToSend.append('gender', formData.gender || '');
      formDataToSend.append('aadhar_card', formData.aadhar_card?.trim() || '');
      formDataToSend.append('pan_card', formData.pan_card?.trim() || '');
      formDataToSend.append('address', formData.address?.trim() || '');
      formDataToSend.append('joining_date', formData.joining_date || '');
      formDataToSend.append('birth_date', formData.birth_date || '');
      formDataToSend.append('access_pages', selectedPages.join(','));
      formDataToSend.append('status', formData.status || 'Active');
      
      if (isEditMode && formData.emp_id) {
        formDataToSend.append('emp_id', formData.emp_id);
      }

      // Password for new employee
      if (!isEditMode && password) {
        formDataToSend.append('password', password);
      }

      // Append image if new image is selected
      if (imageFile) {
        formDataToSend.append('profile_image', imageFile);
      }

      let res;
      if (isEditMode && formData.emp_id) {
        res = await employeeService.updateEmployee(formDataToSend);
      } else {
        res = await employeeService.addEmployee(formDataToSend);
      }

      if (res.status === "success") {
        toast({ title: "Success", description: isEditMode ? "Employee updated successfully" : "Employee added successfully" });
        navigate("/employees");
      } else {
        toast({ title: "Error", description: res.message || "Operation failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/employees");
  };

  if (loading) {
    return (
      <MainLayout title={isEditMode ? "Edit Employee" : "Add Employee"} subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const title = isViewMode ? "View Employee" : isEditMode ? "Edit Employee" : "Add Employee";
  const imageUrl = imagePreview || (existingImage ? `${API_URL}../uploadfiles/employee/${existingImage}` : "");

  return (
    <MainLayout title={title} subtitle={isViewMode ? "View employee details" : isEditMode ? "Update employee information" : "Add new employee"}>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground border-b pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={nameInputRef}
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => { setFormData((p) => ({ ...p, name: e.target.value })); if (formError) setFormError(""); }}
                    className="h-11 rounded-xl pl-10"
                    placeholder="Enter full name"
                    disabled={isViewMode}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="login_code">
                  Login Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="login_code"
                  value={formData.login_code || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, login_code: e.target.value.toUpperCase() }))}
                  className="h-11 rounded-xl mt-1.5 font-mono"
                  placeholder="e.g. EMP001"
                  disabled={isViewMode}
                  required
                />
              </div>
            </div>

            {/* Password (only for new employee) */}
            {!isEditMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                      className="h-11 rounded-xl pl-10"
                      placeholder="Min 4 characters"
                      disabled={isViewMode}
                    />
                  </div>
                  {passwordError && <p className="text-xs text-destructive mt-1.5">{passwordError}</p>}
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (passwordError) setPasswordError(""); }}
                      className="h-11 rounded-xl pl-10"
                      placeholder="Confirm password"
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone1">Phone 1</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone1"
                    value={formData.phone1 || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, phone1: e.target.value }))}
                    className="h-11 rounded-xl pl-10"
                    placeholder="Enter primary phone"
                    disabled={isViewMode}
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
                    disabled={isViewMode}
                  />
                </div>
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
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <Label>Gender</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {GENDER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.gender === option.value ? "default" : "outline"}
                    className={`
                      rounded-xl px-4 h-9 flex-1 min-w-[80px] transition-all
                      ${formData.gender === option.value 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'hover:bg-muted'
                      }
                    `}
                    onClick={() => setFormData((p) => ({ ...p, gender: option.value }))}
                    disabled={isViewMode}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Aadhar & PAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aadhar_card">Aadhar Card</Label>
                <div className="relative mt-1.5">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="aadhar_card"
                    value={formData.aadhar_card || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, aadhar_card: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                    className="h-11 rounded-xl pl-10 font-mono"
                    placeholder="12-digit Aadhar number"
                    maxLength={12}
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pan_card">PAN Card</Label>
                <Input
                  id="pan_card"
                  value={formData.pan_card || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, pan_card: e.target.value.toUpperCase().slice(0, 10) }))}
                  className="h-11 rounded-xl mt-1.5 font-mono uppercase"
                  placeholder="AAAAA9999A"
                  maxLength={10}
                  disabled={isViewMode}
                />
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
                  placeholder="Enter full address"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Joining & Birth Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="joining_date">Joining Date</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="joining_date"
                    type="date"
                    value={formData.joining_date || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, joining_date: e.target.value }))}
                    className="h-11 rounded-xl pl-10"
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="birth_date">Birth Date</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, birth_date: e.target.value }))}
                    className="h-11 rounded-xl pl-10"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
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

            {/* Profile Image */}
            <div>
              <Label>Profile Image</Label>
              <div className="mt-1.5">
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Profile"
                      className="h-32 w-32 object-cover rounded-full border"
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
                      ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted-foreground/25 bg-muted/10 hover:bg-muted/20'}
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
                        <ImageIcon className="h-12 w-12 text-primary animate-bounce" />
                        <p className="text-sm font-medium text-primary mt-2">Drop your image here</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground mt-2">Drag & drop your image here</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">or click to browse</p>
                        <p className="text-xs text-muted-foreground/40 mt-2">JPG, PNG, WEBP • Max 5MB</p>
                      </>
                    )}
                  </div>
                )}
                {!isViewMode && (
                  <div className="mt-2 flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" />
                      {imageUrl ? "Change Image" : "Browse Files"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Access Pages Section - Group Wise */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground">Access Pages</h3>
                <Badge variant="secondary" className="ml-2">
                  {selectedPages.length} selected
                </Badge>
              </div>
              {!isViewMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (selectedPages.length === PAGE_GROUPS.flatMap(g => g.pages).length) {
                      setSelectedPages([]);
                    } else {
                      setSelectedPages(PAGE_GROUPS.flatMap(g => g.pages.map(p => p.value)));
                    }
                  }}
                >
                  {selectedPages.length === PAGE_GROUPS.flatMap(g => g.pages).length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {PAGE_GROUPS.map((group) => {
                const Icon = group.icon;
                const fullySelected = isGroupFullySelected(group.pages);
                const partiallySelected = isGroupPartiallySelected(group.pages);

                return (
                  <div key={group.name} className="rounded-xl border border-border overflow-hidden">
                    {/* Group Header */}
                    <div 
                      className={`
                        flex items-center justify-between px-4 py-2.5 bg-muted/30 cursor-pointer transition-colors
                        ${!isViewMode && 'hover:bg-muted/50'}
                      `}
                      onClick={() => !isViewMode && toggleAllPagesInGroup(group.pages)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{group.name}</span>
                        <Badge 
                          variant={fullySelected ? "default" : partiallySelected ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {group.pages.filter(p => selectedPages.includes(p.value)).length}/{group.pages.length}
                        </Badge>
                      </div>
                      {!isViewMode && (
                        <div className="flex items-center gap-2">
                          {fullySelected ? (
                            <Badge className="bg-success/10 text-success border-success/20 text-xs">All Selected</Badge>
                          ) : partiallySelected ? (
                            <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Partial</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">None</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Group Pages */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 p-3">
                      {group.pages.map((page) => (
                        <Button
                          key={page.value}
                          type="button"
                          variant={selectedPages.includes(page.value) ? "default" : "outline"}
                          className={`
                            rounded-lg h-8 text-xs justify-start px-3 transition-all
                            ${selectedPages.includes(page.value) 
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                              : 'hover:bg-muted'
                            }
                          `}
                          onClick={() => togglePage(page.value)}
                          disabled={isViewMode}
                        >
                          <span className="truncate">
                            {selectedPages.includes(page.value) && "✓ "}
                            {page.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedPages.length === 0 && !isViewMode && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-sm text-warning">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                No pages selected. Employee will not have access to any pages.
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Click on a group header to select/deselect all pages in that group
            </p>
          </div>

          {formError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              {formError}
            </div>
          )}

          {!isViewMode && (
            <div className="flex gap-3">
              <Button type="submit" className="rounded-xl h-11 px-6 gap-2" disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> {isEditMode ? "Update Employee" : "Add Employee"}</>
                )}
              </Button>
              <Button type="button" variant="outline" className="rounded-xl h-11 px-6" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          )}

          {isViewMode && (
            <Button type="button" className="rounded-xl h-11 px-6" onClick={handleCancel}>
              Back to List
            </Button>
          )}
        </form>
      </div>
    </MainLayout>
  );
}