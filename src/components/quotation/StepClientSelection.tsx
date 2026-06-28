// src/components/quotation/StepClientSelection.tsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  Loader2,
} from "lucide-react";
import { Customer } from "@/services/customer.service";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { customerService } from "@/services/customer.service";
import { stateService, State } from "@/services/state.service";
import { cityService, City } from "@/services/city.service";
import { areaService, Area } from "@/services/area.service";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface StepClientSelectionProps {
  clients: Customer[];
  selectedClient: Customer | null;
  onSelectClient: (client: Customer) => void;
  loading?: boolean;
}

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export function StepClientSelection({
  clients,
  selectedClient,
  onSelectClient,
  loading = false,
}: StepClientSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);

  const [formData, setFormData] = useState<Partial<Customer>>({
    client_name: "",
    gender: "",
    phone1: "",
    phone2: "",
    whatsapp_number: "",
    address: "",
    state_id: "",
    city_id: "",
    area_id: "",
    status: "Active",
  });

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const companyId = getCompanyId();
        if (!companyId) return;

        const [statesRes, citiesRes, areasRes] = await Promise.all([
          stateService.getStates(companyId),
          cityService.getCities(companyId),
          areaService.getAreas(companyId),
        ]);

        if (statesRes.status === "success" && statesRes.data) setStates(statesRes.data);
        if (citiesRes.status === "success" && citiesRes.data) setCities(citiesRes.data);
        if (areasRes.status === "success" && areasRes.data) setAreas(areasRes.data);
      } catch (e: any) {
        console.error("Failed to load master data", e);
      } finally {
        setLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  useEffect(() => {
    if (formData.state_id) {
      const filtered = cities.filter((c) => c.state_id === formData.state_id);
      setFilteredCities(filtered);
      if (filtered.length === 1 && !formData.city_id) {
        setFormData((prev) => ({ ...prev, city_id: filtered[0].city_id }));
      }
    } else {
      setFilteredCities([]);
    }
  }, [formData.state_id, cities]);

  useEffect(() => {
    if (formData.city_id) {
      const filtered = areas.filter((a) => a.city_id === formData.city_id);
      setFilteredAreas(filtered);
      if (filtered.length === 1 && !formData.area_id) {
        setFormData((prev) => ({ ...prev, area_id: filtered[0].area_id }));
      }
    } else {
      setFilteredAreas([]);
    }
  }, [formData.city_id, areas]);

  const filteredClients = clients.filter((client) => {
    const search = searchQuery.toLowerCase();
    return (
      client.client_name?.toLowerCase().includes(search) ||
      client.phone1?.includes(searchQuery) ||
      client.phone2?.includes(searchQuery) ||
      client.email?.toLowerCase().includes(search)
    );
  });

  const handleAddCustomer = async () => {
    if (!formData.client_name?.trim()) {
      setFormError("Customer name is required");
      return;
    }
    if (!formData.phone1?.trim()) {
      setFormError("Phone number is required");
      return;
    }

    setFormError("");
    setSaving(true);

    try {
      const res = await customerService.addCustomer({
        company_id: getCompanyId(),
        client_name: formData.client_name!.trim(),
        gender: formData.gender || "",
        phone1: formData.phone1!.trim(),
        phone2: formData.phone2?.trim() || "",
        whatsapp_number: formData.whatsapp_number?.trim() || "",
        address: formData.address?.trim() || "",
        state_id: formData.state_id || "",
        city_id: formData.city_id || "",
        area_id: formData.area_id || "",
        status: formData.status || "Active",
      });

      if (res.status === "success") {
        toast({ title: "Success", description: "Customer added successfully" });
        const refreshRes = await customerService.getCustomers(getCompanyId());
        if (refreshRes.status === "success" && refreshRes.data) {
          const newClient = refreshRes.data.find((c) => c.client_id === res.client_id);
          if (newClient) onSelectClient(newClient);
        }
        setIsAddDialogOpen(false);
        setFormData({
          client_name: "",
          gender: "",
          phone1: "",
          phone2: "",
          whatsapp_number: "",
          address: "",
          state_id: "",
          city_id: "",
          area_id: "",
          status: "Active",
        });
      } else {
        toast({ title: "Error", description: res.message || "Failed to add customer", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const stateOptions = states.map((s) => ({ value: s.state_id || "", label: s.state_name }));
  const cityOptions = filteredCities.map((c) => ({ value: c.city_id || "", label: c.city_name }));
  const areaOptions = filteredAreas.map((a) => ({ value: a.area_id || "", label: a.area_name }));

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 bg-card border-border shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground">Select Client</h2>
                <p className="text-sm text-muted-foreground">Choose an existing client or add a new one</p>
              </div>
              <Button variant="outline" className="gap-2 shrink-0" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4" /> Add Client
              </Button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-0 h-11 rounded-xl"
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No clients found matching your search" : "No clients available"}
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.client_id}
                    onClick={() => onSelectClient(client)}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                      selectedClient?.client_id === client.client_id
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-transparent bg-secondary/50 hover:bg-secondary hover:border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0",
                            selectedClient?.client_id === client.client_id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {client.client_name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{client.client_name}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{client.phone1}</span>
                            {client.email && (
                              <>
                                <span className="text-muted-foreground/30">|</span>
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </>
                            )}
                          </div>
                          {(client.address || client.city_name || client.state_name) && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {[client.address, client.city_name, client.state_name].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedClient?.client_id === client.client_id && (
                        <div className="shrink-0">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 bg-card border-border shadow-soft sticky top-24">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Client Details</h3>
            {selectedClient ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <User className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground truncate">{selectedClient.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{selectedClient.phone1}</p>
                    {selectedClient.phone2 && (
                      <p className="text-sm text-muted-foreground">{selectedClient.phone2}</p>
                    )}
                  </div>
                </div>
                {selectedClient.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <Mail className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground truncate">{selectedClient.email}</p>
                    </div>
                  </div>
                )}
                {(selectedClient.address || selectedClient.city_name || selectedClient.state_name) && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-medium text-foreground">
                        {[selectedClient.address, selectedClient.city_name, selectedClient.state_name].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {selectedClient.gender && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <User className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="font-medium text-foreground">{selectedClient.gender}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Select a client to view details</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Fill in the details to add a new customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="client_name">Customer Name <span className="text-destructive">*</span></Label>
              <Input
                id="client_name"
                value={formData.client_name || ""}
                onChange={(e) => { setFormData((p) => ({ ...p, client_name: e.target.value })); if (formError) setFormError(""); }}
                className="h-11 rounded-xl mt-1.5"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {GENDER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.gender === option.value ? "default" : "outline"}
                    className={`rounded-xl px-4 h-9 flex-1 min-w-[80px] transition-all ${formData.gender === option.value ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-muted'}`}
                    onClick={() => setFormData((p) => ({ ...p, gender: option.value }))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone1">Phone 1 <span className="text-destructive">*</span></Label>
                <Input
                  id="phone1"
                  value={formData.phone1 || ""}
                  onChange={(e) => { setFormData((p) => ({ ...p, phone1: e.target.value })); if (formError) setFormError(""); }}
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="Enter primary phone"
                />
              </div>
              <div>
                <Label htmlFor="phone2">Phone 2</Label>
                <Input
                  id="phone2"
                  value={formData.phone2 || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, phone2: e.target.value }))}
                  className="h-11 rounded-xl mt-1.5"
                  placeholder="Enter alternate phone"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
              <Input
                id="whatsapp_number"
                value={formData.whatsapp_number || ""}
                onChange={(e) => setFormData((p) => ({ ...p, whatsapp_number: e.target.value }))}
                className="h-11 rounded-xl mt-1.5"
                placeholder="Enter WhatsApp number"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>State</Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={stateOptions}
                    value={formData.state_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, state_id: v, city_id: "", area_id: "" }))}
                    placeholder="Select state..."
                    disabled={loadingMasters}
                  />
                </div>
              </div>
              <div>
                <Label>City</Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={cityOptions}
                    value={formData.city_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, city_id: v, area_id: "" }))}
                    placeholder={formData.state_id ? "Select city..." : "Select state first"}
                    disabled={!formData.state_id || loadingMasters}
                  />
                </div>
              </div>
              <div>
                <Label>Area</Label>
                <div className="mt-1.5">
                  <SearchableSelect
                    options={areaOptions}
                    value={formData.area_id || ""}
                    onChange={(v) => setFormData((p) => ({ ...p, area_id: v }))}
                    placeholder={formData.city_id ? "Select area..." : "Select city first"}
                    disabled={!formData.city_id || loadingMasters}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                className="h-11 rounded-xl mt-1.5"
                placeholder="Enter address"
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
                />
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl h-11 flex-1 sm:flex-none" onClick={() => setIsAddDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button className="rounded-xl h-11 flex-1 sm:flex-none gap-2" onClick={handleAddCustomer} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Add Customer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}