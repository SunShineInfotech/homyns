// src/pages/Leads/LeadForm.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { leadService, Lead } from "@/services/lead.service";
import { stateService, State } from "@/services/state.service";
import { cityService, City } from "@/services/city.service";
import { areaService, Area } from "@/services/area.service";
import { leadSourceService, LeadSource } from "@/services/lead-source.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import { employeeService, Employee } from "@/services/employee.service";
import {
  projectTypeService,
  ProjectType,
} from "@/services/project-type.service";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Building2,
  Home,
} from "lucide-react";

const EMPTY_FORM: Partial<Lead> = {
  lead_name: "",
  phone1: "",
  phone2: "",
  whatsapp_number: "",
  email: "",
  address: "",
  state_id: "",
  city_id: "",
  area_id: "",
  source_id: "",
  requirement: "",
  budget: 0,
  assigned_to: "",
  status: "",
  project_name: "",
  house_number: "",
  project_type_id: "",
};

export default function LeadForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const isViewMode = window.location.pathname.includes("/view/");

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Get the return path from location state or use default
  const from = (location.state as any)?.from || "/all-leads";
  const returnPath = from || "/all-leads";

  const [formData, setFormData] = useState<Partial<Lead>>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Master data
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Add new dialogs
  const [addStateDialog, setAddStateDialog] = useState(false);
  const [addCityDialog, setAddCityDialog] = useState(false);
  const [addAreaDialog, setAddAreaDialog] = useState(false);
  const [addSourceDialog, setAddSourceDialog] = useState(false);
  const [addStatusDialog, setAddStatusDialog] = useState(false);
  const [addProjectTypeDialog, setAddProjectTypeDialog] = useState(false);

  const [newStateName, setNewStateName] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [newCityStateId, setNewCityStateId] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaCityId, setNewAreaCityId] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [newProjectTypeName, setNewProjectTypeName] = useState("");
  const [addingNew, setAddingNew] = useState(false);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
    return "";
  };

  const getEmployeeId = (): string => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) return JSON.parse(raw)?.emp_id || "";
    } catch {
      return "";
    }
    return "";
  };

  // Fetch masters
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

        const [
          statesRes,
          citiesRes,
          areasRes,
          sourcesRes,
          statusesRes,
          employeesRes,
          projectTypesRes,
        ] = await Promise.all([
          stateService.getStates(companyId),
          cityService.getCities(companyId),
          areaService.getAreas(companyId),
          leadSourceService.getLeadSources(companyId),
          leadStatusService.getLeadStatuses(companyId),
          employeeService.getEmployees(companyId),
          projectTypeService.getProjectTypes(companyId),
        ]);

        if (statesRes.status === "success") setStates(statesRes.data || []);
        if (citiesRes.status === "success") setCities(citiesRes.data || []);
        if (areasRes.status === "success") setAreas(areasRes.data || []);
        if (sourcesRes.status === "success") setSources(sourcesRes.data || []);
        if (statusesRes.status === "success")
          setStatuses(statusesRes.data || []);
        if (employeesRes.status === "success")
          setEmployees(employeesRes.data || []);
        if (projectTypesRes.status === "success")
          setProjectTypes(projectTypesRes.data || []);

        // Auto-select first status if available
        if (!isEditMode && statusesRes.data?.length > 0) {
          setFormData((prev) => ({
            ...prev,
            status: statusesRes.data[0].status_id,
          }));
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

  // Fetch lead for edit
  useEffect(() => {
    if (isEditMode && id) {
      const fetchLead = async () => {
        setLoading(true);
        try {
          const res = await leadService.getLead(id);
          if (res.status === "success" && res.data) {
            setFormData(res.data);
          } else {
            toast({
              title: "Error",
              description: res.message || "Failed to fetch lead",
              variant: "destructive",
            });
            navigate(returnPath);
          }
        } catch (e: any) {
          toast({
            title: "Error",
            description: e?.message || "Something went wrong",
            variant: "destructive",
          });
          navigate(returnPath);
        } finally {
          setLoading(false);
        }
      };
      fetchLead();
    }
  }, [id, isEditMode, navigate, returnPath]);

  // Add handlers
  const handleAddState = async () => {
    if (!newStateName.trim()) {
      toast({
        title: "Error",
        description: "State name is required",
        variant: "destructive",
      });
      return;
    }
    setAddingNew(true);
    try {
      const res = await stateService.addState({
        company_id: getCompanyId(),
        state_name: newStateName.trim(),
      });
      if (res.status === "success") {
        toast({ title: "Success", description: "State added successfully" });
        setNewStateName("");
        setAddStateDialog(false);
        const updatedRes = await stateService.getStates(getCompanyId());
        if (updatedRes.status === "success" && updatedRes.data) {
          setStates(updatedRes.data);
          const newState = updatedRes.data.find(
            (s) => s.state_name === newStateName.trim(),
          );
          if (newState?.state_id) {
            setFormData((p) => ({ ...p, state_id: newState.state_id }));
          }
        }
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add state",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAddingNew(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim() || !newCityStateId) {
      toast({
        title: "Error",
        description: "City name and state are required",
        variant: "destructive",
      });
      return;
    }
    setAddingNew(true);
    try {
      const res = await cityService.addCity({
        company_id: getCompanyId(),
        city_name: newCityName.trim(),
        state_id: newCityStateId,
      });
      if (res.status === "success") {
        toast({ title: "Success", description: "City added successfully" });
        setNewCityName("");
        setNewCityStateId("");
        setAddCityDialog(false);
        const updatedRes = await cityService.getCities(getCompanyId());
        if (updatedRes.status === "success" && updatedRes.data) {
          setCities(updatedRes.data);
          const newCity = updatedRes.data.find(
            (c) => c.city_name === newCityName.trim(),
          );
          if (newCity?.city_id) {
            setFormData((p) => ({ ...p, city_id: newCity.city_id }));
          }
        }
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add city",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAddingNew(false);
    }
  };

  const handleAddArea = async () => {
    if (!newAreaName.trim() || !newAreaCityId) {
      toast({
        title: "Error",
        description: "Area name and city are required",
        variant: "destructive",
      });
      return;
    }
    setAddingNew(true);
    try {
      const res = await areaService.addArea({
        company_id: getCompanyId(),
        area_name: newAreaName.trim(),
        city_id: newAreaCityId,
      });
      if (res.status === "success") {
        toast({ title: "Success", description: "Area added successfully" });
        setNewAreaName("");
        setNewAreaCityId("");
        setAddAreaDialog(false);
        const updatedRes = await areaService.getAreas(getCompanyId());
        if (updatedRes.status === "success" && updatedRes.data) {
          setAreas(updatedRes.data);
          const newArea = updatedRes.data.find(
            (a) => a.area_name === newAreaName.trim(),
          );
          if (newArea?.area_id) {
            setFormData((p) => ({ ...p, area_id: newArea.area_id }));
          }
        }
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add area",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAddingNew(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim()) {
      toast({
        title: "Error",
        description: "Source name is required",
        variant: "destructive",
      });
      return;
    }
    setAddingNew(true);
    try {
      const res = await leadSourceService.addLeadSource({
        company_id: getCompanyId(),
        source_name: newSourceName.trim(),
      });
      if (res.status === "success") {
        toast({ title: "Success", description: "Source added successfully" });
        setNewSourceName("");
        setAddSourceDialog(false);
        const updatedRes =
          await leadSourceService.getLeadSources(getCompanyId());
        if (updatedRes.status === "success" && updatedRes.data) {
          setSources(updatedRes.data);
          const newSource = updatedRes.data.find(
            (s) => s.source_name === newSourceName.trim(),
          );
          if (newSource?.source_id) {
            setFormData((p) => ({ ...p, source_id: newSource.source_id }));
          }
        }
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add source",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAddingNew(false);
    }
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) {
      toast({
        title: "Error",
        description: "Status name is required",
        variant: "destructive",
      });
      return;
    }
    setAddingNew(true);
    try {
      const res = await leadStatusService.addLeadStatus({
        company_id: getCompanyId(),
        status_name: newStatusName.trim(),
      });
      if (res.status === "success") {
        toast({ title: "Success", description: "Status added successfully" });
        setNewStatusName("");
        setAddStatusDialog(false);
        const updatedRes =
          await leadStatusService.getLeadStatuses(getCompanyId());
        if (updatedRes.status === "success" && updatedRes.data) {
          setStatuses(updatedRes.data);
          const newStatus = updatedRes.data.find(
            (s) => s.status_name === newStatusName.trim(),
          );
          if (newStatus?.status_id) {
            setFormData((p) => ({ ...p, status: newStatus.status_id }));
          }
        }
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add status",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAddingNew(false);
    }
  };

  const handleAddProjectType = async () => {
    if (!newProjectTypeName.trim()) {
      toast({
        title: "Error",
        description: "Project type name is required",
        variant: "destructive",
      });
      return;
    }
    setAddingNew(true);
    try {
      const res = await projectTypeService.addProjectType({
        company_id: getCompanyId(),
        project_type_name: newProjectTypeName.trim(),
      });
      if (res.status === "success") {
        toast({
          title: "Success",
          description: "Project type added successfully",
        });
        setNewProjectTypeName("");
        setAddProjectTypeDialog(false);
        const updatedRes =
          await projectTypeService.getProjectTypes(getCompanyId());
        if (updatedRes.status === "success" && updatedRes.data) {
          setProjectTypes(updatedRes.data);
          const newType = updatedRes.data.find(
            (p) => p.project_type_name === newProjectTypeName.trim(),
          );
          if (newType?.project_type_id) {
            setFormData((p) => ({
              ...p,
              project_type_id: newType.project_type_id,
            }));
          }
        }
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to add project type",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setAddingNew(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only these 5 fields are required: Lead Name, Phone, Lead Source, Assigned To, Status.
    // Everything else on the form is optional.
    if (!formData.lead_name?.trim()) {
      setFormError("Lead name is required.");
      nameInputRef.current?.focus();
      return;
    }
    if (!formData.phone1?.trim()) {
      setFormError("Phone number is required.");
      return;
    }
    if (!formData.source_id) {
      setFormError("Lead source is required.");
      return;
    }
    if (!formData.assigned_to) {
      setFormError("Assigned To is required.");
      return;
    }
    if (!formData.status) {
      setFormError("Status is required.");
      return;
    }
    if (!formData.state_id) {
      setFormError("State is required.");
      return;
    }
    if (!formData.city_id) {
      setFormError("City is required.");
      return;
    }
    if (!formData.area_id) {
      setFormError("Area is required.");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const companyId = getCompanyId();
      const empId = getEmployeeId();

      const payload = {
        company_id: companyId,
        lead_name: formData.lead_name.trim(),
        phone1: formData.phone1.trim(),
        phone2: formData.phone2 || "",
        whatsapp_number: formData.whatsapp_number || "",
        email: formData.email || "",
        address: formData.address || "",
        state_id: formData.state_id || "",
        city_id: formData.city_id || "",
        area_id: formData.area_id || "",
        source_id: formData.source_id || "",
        requirement: formData.requirement || "",
        budget: formData.budget || 0,
        assigned_to: formData.assigned_to || empId,
        status: formData.status || "",
        status_name: formData.status_name || "",
        project_name: formData.project_name || "",
        house_number: formData.house_number || "",
        project_type_id: formData.project_type_id || "",
      };

      let res;
      if (isEditMode && id) {
        res = await leadService.updateLead({ ...payload, lead_id: id });
      } else {
        res = await leadService.addLead(payload);
      }

      if (res.status === "success") {
        toast({
          title: "Success",
          description: isEditMode
            ? "Lead updated successfully"
            : "Lead added successfully",
        });
        // Navigate back to the page we came from
        navigate(returnPath);
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
        description: e?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(returnPath);
  };

  if (loading || loadingMasters) {
    return (
      <MainLayout
        title={isEditMode ? "Edit Lead" : "Add Lead"}
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Options with "Add New" option
  const stateOptions = [
    ...states.map((s) => ({ value: s.state_id || "", label: s.state_name })),
    { value: "__add_new__", label: "+ Add New State" },
  ];

  const cityOptions = [
    ...cities.map((c) => ({ value: c.city_id || "", label: c.city_name })),
    { value: "__add_new__", label: "+ Add New City" },
  ];

  const areaOptions = [
    ...areas.map((a) => ({ value: a.area_id || "", label: a.area_name })),
    { value: "__add_new__", label: "+ Add New Area" },
  ];

  const sourceOptions = [
    ...sources.map((s) => ({ value: s.source_id || "", label: s.source_name })),
    { value: "__add_new__", label: "+ Add New Source" },
  ];

  const statusOptions = [
    ...statuses.map((s) => ({
      value: s.status_name || "",
      label: s.status_name || "",
    })),
    { value: "__add_new__", label: "+ Add New Status" },
  ];

  const projectTypeOptions = [
    ...projectTypes.map((p) => ({
      value: p.project_type_id || "",
      label: p.project_type_name,
    })),
    { value: "__add_new__", label: "+ Add New Project Type" },
  ];

  const employeeOptions = employees.map((e) => ({
    value: e.emp_id || "",
    label: e.name || e.name || "",
  }));

  // Handle select changes with add new
  const handleStateSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddStateDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, state_id: value }));
  };

  const handleCitySelect = (value: string) => {
    if (value === "__add_new__") {
      setAddCityDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, city_id: value }));
  };

  const handleAreaSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddAreaDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, area_id: value }));
  };

  const handleSourceSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddSourceDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, source_id: value }));
  };

  const handleStatusSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddStatusDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, status: value, status_name: value }));
  };

  const handleProjectTypeSelect = (value: string) => {
    if (value === "__add_new__") {
      setAddProjectTypeDialog(true);
      return;
    }
    setFormData((p) => ({ ...p, project_type_id: value }));
  };

  // Determine the back button label based on where we came from
  const getBackLabel = () => {
    if (returnPath === "/my-leads") return "Back to My Leads";
    if (returnPath === "/all-leads") return "Back to All Leads";
    return "Back to Leads";
  };

  return (
    <MainLayout
      title={isEditMode ? "Edit Lead" : "Add Lead"}
      subtitle={isEditMode ? "Update lead information" : "Add new lead"}
    >
      <div className="p-4 md:p-6 max-w-1xl mx-auto">
        {!isViewMode && (
          <Button
            variant="outline"
            className="gap-2 rounded-xl mb-4"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4" /> {getBackLabel()}
          </Button>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="text-base font-semibold border-b pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Lead Information
            </h3>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lead_name">
                  Lead Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  ref={nameInputRef}
                  id="lead_name"
                  value={formData.lead_name || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, lead_name: e.target.value }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="Enter lead name"
                  disabled={isViewMode}
                />
              </div>
              <div>
                <Label htmlFor="phone1">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone1"
                  value={formData.phone1 || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone1: e.target.value }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="Enter phone number"
                  disabled={isViewMode}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Phone2 & WhatsApp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone2">Alternate Phone</Label>
                <Input
                  id="phone2"
                  value={formData.phone2 || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone2: e.target.value }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="Enter alternate phone"
                  disabled={isViewMode}
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number || ""}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      whatsapp_number: e.target.value,
                    }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="Enter WhatsApp number"
                  disabled={isViewMode}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  className="h-11 rounded-xl pl-10"
                  placeholder="Enter email address"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Project Name, House Number, Project Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project_name">Project Name</Label>
                <div className="relative mt-1.5">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="project_name"
                    value={formData.project_name || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        project_name: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl pl-10"
                    placeholder="Enter project name"
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="house_number">House Number</Label>
                <div className="relative mt-1.5">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="house_number"
                    value={formData.house_number || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        house_number: e.target.value,
                      }))
                    }
                    className="h-11 rounded-xl pl-10"
                    placeholder="Enter house number"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Project Type</Label>
              <div className="mt-1.5">
                <SearchableSelect
                  options={projectTypeOptions}
                  value={formData.project_type_id || ""}
                  onChange={handleProjectTypeSelect}
                  placeholder="Select project type..."
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
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, address: e.target.value }))
                  }
                  className="min-h-[80px] rounded-xl pl-10 resize-y"
                  placeholder="Enter address"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Location: State, City, Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>
                  State <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={stateOptions}
                    value={formData.state_id || ""}
                    onChange={handleStateSelect}
                    placeholder="Select state..."
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div>
                <Label>
                  City <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={cityOptions}
                    value={formData.city_id || ""}
                    onChange={handleCitySelect}
                    placeholder="Select city..."
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div>
                <Label>
                  Area <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={areaOptions}
                    value={formData.area_id || ""}
                    onChange={handleAreaSelect}
                    placeholder="Select area..."
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-card rounded-2xl border p-6 space-y-4">
            <h3 className="text-base font-semibold border-b pb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Lead Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>
                  Lead Source <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={sourceOptions}
                    value={formData.source_id || ""}
                    onChange={handleSourceSelect}
                    placeholder="Select source..."
                    disabled={isViewMode}
                  />
                </div>
              </div>
              <div>
                <Label>
                  Status <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={statusOptions}
                    value={formData.status || ""}
                    onChange={handleStatusSelect}
                    placeholder="Select status..."
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget || 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      budget: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="Enter budget"
                  min="0"
                  step="0.01"
                  disabled={isViewMode}
                />
              </div>
              <div>
                <Label>
                  Assigned To <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={employeeOptions}
                    value={formData.assigned_to || ""}
                    onChange={(v) =>
                      setFormData((p) => ({ ...p, assigned_to: v }))
                    }
                    placeholder="Assign to employee..."
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="requirement">Requirement</Label>
              <Textarea
                id="requirement"
                value={formData.requirement || ""}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, requirement: e.target.value }))
                }
                className="min-h-[80px] rounded-xl mt-1.5 resize-y"
                placeholder="Describe the lead's requirement..."
                disabled={isViewMode}
              />
            </div>
          </div>

          {formError && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              {formError}
            </div>
          )}

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
                    {isEditMode ? "Update Lead" : "Add Lead"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-11 px-6"
                onClick={handleCancel}
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
              {getBackLabel()}
            </Button>
          )}
        </form>
      </div>

      {/* Add State Dialog */}
      <Dialog open={addStateDialog} onOpenChange={setAddStateDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New State</DialogTitle>
            <DialogDescription>
              Enter the name for the new state.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newStateName">State Name</Label>
            <Input
              id="newStateName"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddState();
                }
              }}
              className="h-11 rounded-xl mt-1.5"
              placeholder="e.g. Gujarat"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddStateDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddState}
              disabled={addingNew}
            >
              {addingNew ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add State"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add City Dialog */}
      <Dialog open={addCityDialog} onOpenChange={setAddCityDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New City</DialogTitle>
            <DialogDescription>
              Enter the details for the new city.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="newCityName">City Name</Label>
              <Input
                id="newCityName"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Surat"
                autoFocus
              />
            </div>
            <div>
              <Label>State</Label>
              <SearchableSelect
                options={states.map((s) => ({
                  value: s.state_id || "",
                  label: s.state_name,
                }))}
                value={newCityStateId}
                onChange={(v) => setNewCityStateId(v)}
                placeholder="Select state..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddCityDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddCity}
              disabled={addingNew}
            >
              {addingNew ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add City"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Area Dialog */}
      <Dialog open={addAreaDialog} onOpenChange={setAddAreaDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Area</DialogTitle>
            <DialogDescription>
              Enter the details for the new area.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="newAreaName">Area Name</Label>
              <Input
                id="newAreaName"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="h-11 rounded-xl mt-1.5"
                placeholder="e.g. Adajan"
                autoFocus
              />
            </div>
            <div>
              <Label>City</Label>
              <SearchableSelect
                options={cities.map((c) => ({
                  value: c.city_id || "",
                  label: c.city_name,
                }))}
                value={newAreaCityId}
                onChange={(v) => setNewAreaCityId(v)}
                placeholder="Select city..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddAreaDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddArea}
              disabled={addingNew}
            >
              {addingNew ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Area"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Source Dialog */}
      <Dialog open={addSourceDialog} onOpenChange={setAddSourceDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead Source</DialogTitle>
            <DialogDescription>
              Enter the name for the new lead source.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newSourceName">Source Name</Label>
            <Input
              id="newSourceName"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSource();
                }
              }}
              className="h-11 rounded-xl mt-1.5"
              placeholder="e.g. LinkedIn, Referral, etc."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddSourceDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddSource}
              disabled={addingNew}
            >
              {addingNew ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Status Dialog */}
      <Dialog open={addStatusDialog} onOpenChange={setAddStatusDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead Status</DialogTitle>
            <DialogDescription>
              Enter the name for the new lead status.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newStatusName">Status Name</Label>
            <Input
              id="newStatusName"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddStatus();
                }
              }}
              className="h-11 rounded-xl mt-1.5"
              placeholder="e.g. Hot Lead, Cold Lead, etc."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddStatusDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddStatus}
              disabled={addingNew}
            >
              {addingNew ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Project Type Dialog */}
      <Dialog
        open={addProjectTypeDialog}
        onOpenChange={setAddProjectTypeDialog}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Project Type</DialogTitle>
            <DialogDescription>
              Enter the name for the new project type.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newProjectTypeName">Project Type Name</Label>
            <Input
              id="newProjectTypeName"
              value={newProjectTypeName}
              onChange={(e) => setNewProjectTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddProjectType();
                }
              }}
              className="h-11 rounded-xl mt-1.5"
              placeholder="e.g. Residential, Commercial, etc."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl h-11"
              onClick={() => setAddProjectTypeDialog(false)}
              disabled={addingNew}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 gap-2"
              onClick={handleAddProjectType}
              disabled={addingNew}
            >
              {addingNew ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Project Type"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
