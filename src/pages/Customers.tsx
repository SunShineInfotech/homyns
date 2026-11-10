import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
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
import { customerService, Customer } from "@/services/customer.service";
import { stateService, State } from "@/services/state.service";
import { cityService, City } from "@/services/city.service";
import { areaService, Area } from "@/services/area.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Copy,
  Building2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type SortKey = "client_name" | "phone1" | "client_email" | "state_name" | "city_name";
type SortDir = "asc" | "desc";

interface CustomerWithDetails extends Customer {
  state_name?: string;
  city_name?: string;
  area_name?: string;
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

const EMPTY_FORM: Partial<CustomerWithDetails> = {
  client_name: "",
  client_email: "",
  gender: "",
  phone1: "",
  phone2: "",
  whatsapp_number: "",
  address: "",
  state_id: "",
  city_id: "",
  area_id: "",
  status: "Active",
};

export default function Customers() {
  const navigate = useNavigate();
  /* ── data ─────────────────────────────────────────────────────── */
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filtered, setFiltered] = useState<CustomerWithDetails[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("client_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  /* ── UI ───────────────────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomerWithDetails | null>(null);

  /* ── form ─────────────────────────────────────────────────────── */
  const [formData, setFormData] = useState<Partial<CustomerWithDetails>>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  
  /* ── filtered dropdowns ──────────────────────────────────────── */
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);

  /* ── helpers ──────────────────────────────────────────────────── */
  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  /* ── fetch masters ────────────────────────────────────────────── */
  const fetchMasters = useCallback(async () => {
    setLoadingMasters(true);
    try {
      const cid = getCompanyId();
      if (!cid) return;

      const [statesRes, citiesRes, areasRes] = await Promise.all([
        stateService.getStates(cid),
        cityService.getCities(cid),
        areaService.getAreas(cid),
      ]);

      if (statesRes.status === "success" && statesRes.data) {
        setStates(statesRes.data);
      }
      if (citiesRes.status === "success" && citiesRes.data) {
        setCities(citiesRes.data);
      }
      if (areasRes.status === "success" && areasRes.data) {
        setAreas(areasRes.data);
      }
    } catch (e: any) {
      console.error("Failed to load master data", e);
    } finally {
      setLoadingMasters(false);
    }
  }, []);

  /* ── fetch customers ──────────────────────────────────────────── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await customerService.getCustomers(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        // Map state, city, area names to customers
        const formatted = res.data.map((item: any) => {
          const state = states.find(s => s.state_id === item.state_id);
          const city = cities.find(c => c.city_id === item.city_id);
          const area = areas.find(a => a.area_id === item.area_id);
          return {
            ...item,
            state_name: state?.state_name || '',
            city_name: city?.city_name || '',
            area_name: area?.area_name || '',
          };
        });
        setCustomers(formatted);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch customers", variant: "destructive" });
        setCustomers([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [states, cities, areas]);

  /* ── load data ────────────────────────────────────────────────── */
  useEffect(() => {
    const loadData = async () => {
      await fetchMasters();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loadingMasters) {
      fetchCustomers();
    }
  }, [loadingMasters, fetchCustomers]);

  /* ── filter cities by state ───────────────────────────────────── */
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

  /* ── filter areas by city ────────────────────────────────────── */
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

  /* ── filter + sort ────────────────────────────────────────────── */
  useEffect(() => {
    let list = [...customers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.client_name?.toLowerCase().includes(q) ||
          c.phone1?.includes(search) ||
          c.client_email?.toLowerCase().includes(q) ||
          c.state_name?.toLowerCase().includes(q) ||
          c.city_name?.toLowerCase().includes(q) ||
          c.address?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "client_name") {
        va = (a.client_name || "").toLowerCase();
        vb = (b.client_name || "").toLowerCase();
      } else if (sortKey === "phone1") {
        va = (a.phone1 || "");
        vb = (b.phone1 || "");
      } else if (sortKey === "client_email") {
        va = (a.client_email || "").toLowerCase();
        vb = (b.client_email || "").toLowerCase();
      } else if (sortKey === "state_name") {
        va = (a.state_name || "").toLowerCase();
        vb = (b.state_name || "").toLowerCase();
      } else {
        va = (a.city_name || "").toLowerCase();
        vb = (b.city_name || "").toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [customers, search, sortKey, sortDir]);

  /* ── sort toggle ──────────────────────────────────────────────── */
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

  /* ── open form ────────────────────────────────────────────────── */
  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(false);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (c: CustomerWithDetails) => {
    setFormData({
      client_id: c.client_id,
      client_name: c.client_name,
      client_email: c.client_email || "",
      gender: c.gender || "",
      phone1: c.phone1 || "",
      phone2: c.phone2 || "",
      whatsapp_number: c.whatsapp_number || "",
      address: c.address || "",
      state_id: c.state_id || "",
      city_id: c.city_id || "",
      area_id: c.area_id || "",
      status: c.status || "Active",
    });
    setIsEditing(true);
    setFormError("");
    setFormOpen(true);
  };

  /* ── handle WhatsApp copy ────────────────────────────────────── */
  const handleWhatsAppCopy = () => {
    if (formData.phone1) {
      setFormData((prev) => ({ ...prev, whatsapp_number: prev.phone1 }));
      toast({ title: "Copied", description: "Phone 1 copied to WhatsApp number" });
    } else {
      toast({ title: "Info", description: "Please enter Phone 1 first", variant: "default" });
    }
  };

  const sendPaymentReminder = (customer: CustomerWithDetails) => {
    const balance = Number(customer.wallet) || 0;
    if (balance <= 0) {
      toast({ title: "No payment due", description: "This customer has no outstanding wallet balance." });
      return;
    }
    const phone = String(customer.whatsapp_number || customer.phone1 || "").replace(/\D/g, "");
    if (phone.length < 10) {
      toast({ title: "WhatsApp number missing", description: "Add a valid WhatsApp number or phone number to this customer first.", variant: "destructive" });
      return;
    }
    const internationalPhone = phone.length === 10 ? `91${phone}` : phone;
    let companyName = "our team";
    try { companyName = JSON.parse(localStorage.getItem("company_data") || "{}").company_name || companyName; } catch { /* use the generic sender */ }
    const formattedBalance = `₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const message = `Dear ${customer.client_name || "Customer"},\n\nGreetings from ${companyName}. This is a gentle reminder that our records show an outstanding balance of ${formattedBalance} on your account. Please arrange payment at your convenience. If you have already paid, kindly ignore this message.\n\nThank you.`;
    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  /* ── form submit → show confirm ───────────────────────────────── */
  const handleFormSubmit = () => {
    if (!formData.client_name?.trim()) {
      setFormError("Customer name is required.");
      return;
    }
    if (!formData.phone1?.trim()) {
      setFormError("Phone number is required.");
      return;
    }
    setFormError("");
    setFormOpen(false);
    setConfirmOpen(true);
  };

  /* ── confirmed → API call ─────────────────────────────────────── */
  const handleConfirmed = async () => {
    setSaving(true);
    try {
      let res;
      if (isEditing && formData.client_id) {
        res = await customerService.updateCustomer({
          client_id: formData.client_id,
          client_name: formData.client_name!.trim(),
          client_email: formData.client_email?.trim() || "",
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
      } else {
        res = await customerService.addCustomer({
          company_id: getCompanyId(),
          client_name: formData.client_name!.trim(),
          client_email: formData.client_email?.trim() || "",
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
      }

      if (res.status === "success") {
        toast({ title: "Success", description: isEditing ? "Customer updated successfully" : "Customer added successfully" });
        setConfirmOpen(false);
        await fetchCustomers();
        setFormData(EMPTY_FORM);
      } else {
        toast({ title: "Error", description: res.message || "Operation failed", variant: "destructive" });
        setConfirmOpen(false);
        setFormOpen(true);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setConfirmOpen(false);
      setFormOpen(true);
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ───────────────────────────────────────────────────── */
  const askDelete = (c: CustomerWithDetails) => {
    setDeleteTarget(c);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.client_id) return;
    setDeleting(true);
    try {
      const res = await customerService.deleteCustomer(deleteTarget.client_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Customer deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchCustomers();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  /* ── dropdown options ─────────────────────────────────────────── */
  const stateOptions = states.map(s => ({
    value: s.state_id || "",
    label: s.state_name,
  }));

  const cityOptions = filteredCities.map(c => ({
    value: c.city_id || "",
    label: c.city_name,
  }));

  const areaOptions = filteredAreas.map(a => ({
    value: a.area_id || "",
    label: a.area_name,
  }));

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <MainLayout title="Customer Master" subtitle="Manage customers">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">

        {/* toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, state, city or address…"
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
              {filtered.length} {filtered.length === 1 ? "customer" : "customers"}
            </Badge>
            <Button onClick={openAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* skeleton */}
        {loading || loadingMasters ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>

        /* empty */
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No customers match your search" : "No customers added yet"}
            </p>
            {!search && (
              <Button onClick={openAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first customer
              </Button>
            )}
          </div>

        ) : (
          <>
            {/* desktop table */}
            <div className="hidden lg:block rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                      <th
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none min-w-[150px]"
                        onClick={() => toggleSort("client_name")}
                      >
                        <span className="flex items-center gap-1.5">
                          Name <SortIcon col="client_name" />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                        onClick={() => toggleSort("client_email")}
                      >
                        <span className="flex items-center gap-1.5">
                          Email <SortIcon col="client_email" />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                        onClick={() => toggleSort("phone1")}
                      >
                        <span className="flex items-center gap-1.5">
                          Phone <SortIcon col="phone1" />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                        onClick={() => toggleSort("state_name")}
                      >
                        <span className="flex items-center gap-1.5">
                          State <SortIcon col="state_name" />
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                        onClick={() => toggleSort("city_name")}
                      >
                        <span className="flex items-center gap-1.5">
                          City <SortIcon col="city_name" />
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground min-w-[200px]">Address</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground min-w-[130px]">Wallet Balance</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((c, idx) => (
                      <tr key={c.client_id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{c.client_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c.client_email ? (
                            <a href={`mailto:${c.client_email}`} className="text-primary hover:underline flex items-center gap-1">
                              <span className="truncate max-w-[120px]">{c.client_email}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              {c.phone1}
                            </span>
                            {c.phone2 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {c.phone2}
                              </span>
                            )}
                            {c.whatsapp_number && c.whatsapp_number !== c.phone1 && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <span className="font-medium">WA:</span> {c.whatsapp_number}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-normal">
                            {c.state_name || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-normal">
                            {c.city_name || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {c.address ? (
                            <div className="flex items-start gap-1">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              <span className="text-sm line-clamp-2">{c.address}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          <Button variant="link" className="h-auto p-0 font-semibold tabular-nums" onClick={() => navigate(`/customers/${c.client_id}/transactions`)} title="View customer wallet transactions">
                            ₹{(Number(c.wallet) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-green-600 hover:bg-green-500/10 hover:text-green-700"
                              onClick={() => sendPaymentReminder(c)}
                              disabled={(Number(c.wallet) || 0) <= 0 || !(c.whatsapp_number || c.phone1)}
                              title="Send payment reminder on WhatsApp"
                              aria-label={`Send ${c.client_name} a WhatsApp payment reminder`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                              onClick={() => openEdit(c)}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* tablet + mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((c, idx) => (
                <div key={c.client_id} className="rounded-2xl border p-4 bg-card space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {c.client_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{c.client_name}</p>
                        {c.client_email && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            {c.client_email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-green-600 hover:bg-green-500/10 hover:text-green-700"
                        onClick={() => sendPaymentReminder(c)}
                        disabled={(Number(c.wallet) || 0) <= 0 || !(c.whatsapp_number || c.phone1)}
                        title="Send payment reminder on WhatsApp"
                        aria-label={`Send ${c.client_name} a WhatsApp payment reminder`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                        onClick={() => openEdit(c)}
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

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{c.phone1}</span>
                    </div>
                    {c.phone2 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{c.phone2}</span>
                      </div>
                    )}
                    {c.whatsapp_number && c.whatsapp_number !== c.phone1 && (
                      <div className="flex items-center gap-1.5 text-green-600 col-span-2">
                        <span className="font-medium text-xs">WA:</span>
                        <span>{c.whatsapp_number}</span>
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={() => navigate(`/customers/${c.client_id}/transactions`)} className="flex w-full items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm hover:bg-primary/5" title="View customer wallet transactions">
                    <span className="text-muted-foreground">Wallet Balance</span>
                    <span className="font-semibold tabular-nums">₹{(Number(c.wallet) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {c.state_name && (
                      <Badge variant="outline" className="font-normal">
                        {c.state_name}
                      </Badge>
                    )}
                    {c.city_name && (
                      <Badge variant="outline" className="font-normal">
                        {c.city_name}
                      </Badge>
                    )}
                    {c.area_name && (
                      <Badge variant="outline" className="font-normal">
                        {c.area_name}
                      </Badge>
                    )}
                  </div>

                  {c.address && (
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{c.address}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          ADD / EDIT FORM DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the customer details below." : "Fill in the details to add a new customer."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="client_name" className="text-sm">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client_name"
                value={formData.client_name || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, client_name: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-10 md:h-11 rounded-xl mt-1"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <Label htmlFor="client_email" className="text-sm">Email</Label>
              <Input
                id="client_email"
                type="email"
                value={formData.client_email || ""}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, client_email: e.target.value }));
                  if (formError) setFormError("");
                }}
                className="h-10 md:h-11 rounded-xl mt-1"
                placeholder="Enter email address"
              />
            </div>

            {/* Gender - Switch style */}
            <div>
              <Label className="text-sm">Gender</Label>
              <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1">
                {GENDER_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.gender === option.value ? "default" : "outline"}
                    className={`
                      rounded-xl px-3 md:px-4 h-8 md:h-9 flex-1 min-w-[60px] md:min-w-[80px] transition-all text-xs md:text-sm
                      ${formData.gender === option.value 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'hover:bg-muted'
                      }
                    `}
                    onClick={() => setFormData((p) => ({ ...p, gender: option.value }))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label htmlFor="phone1" className="text-sm">
                  Phone 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone1"
                  value={formData.phone1 || ""}
                  onChange={(e) => {
                    setFormData((p) => ({ ...p, phone1: e.target.value }));
                    if (formError) setFormError("");
                  }}
                  className="h-10 md:h-11 rounded-xl mt-1"
                  placeholder="Enter primary phone"
                />
              </div>
              <div>
                <Label htmlFor="phone2" className="text-sm">Phone 2</Label>
                <Input
                  id="phone2"
                  value={formData.phone2 || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, phone2: e.target.value }))}
                  className="h-10 md:h-11 rounded-xl mt-1"
                  placeholder="Enter alternate phone"
                />
              </div>
            </div>

            {/* WhatsApp Number with Copy Button */}
            <div>
              <Label htmlFor="whatsapp_number" className="text-sm">WhatsApp Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, whatsapp_number: e.target.value }))}
                  className="h-10 md:h-11 rounded-xl flex-1"
                  placeholder="Enter WhatsApp number"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 md:h-11 rounded-xl gap-1.5 shrink-0 px-3 md:px-4 text-sm"
                  onClick={handleWhatsAppCopy}
                  title="Copy from Phone 1"
                >
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Use Phone 1</span>
                </Button>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                Click "Use Phone 1" to auto-fill from Phone 1
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <Label className="text-sm">State</Label>
                <div className="mt-1">
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
                <Label className="text-sm">City</Label>
                <div className="mt-1">
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
                <Label className="text-sm">Area</Label>
                <div className="mt-1">
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
              <Label htmlFor="address" className="text-sm">Address</Label>
              <textarea
                id="address"
                value={formData.address || ""}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                className="w-full min-h-[60px] md:min-h-[80px] rounded-xl mt-1 resize-y text-sm border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="Enter address"
              />
            </div>

            <div>
              <Label className="text-sm">Status</Label>
              <div className="mt-1">
                <SearchableSelect
                  options={STATUS_OPTIONS}
                  value={formData.status || "Active"}
                  onChange={(v) => setFormData((p) => ({ ...p, status: v }))}
                  placeholder="Select status..."
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-10 md:h-11 flex-1 sm:flex-none w-full sm:w-auto"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-10 md:h-11 flex-1 sm:flex-none gap-2 w-full sm:w-auto"
              onClick={handleFormSubmit}
              disabled={saving}
            >
              {isEditing ? "Update Customer" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          SAVE CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════════ */}
      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!o && !saving) setConfirmOpen(false); }}>
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {isEditing ? "Update" : "Add"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditing
                ? <>Are you sure you want to update <strong className="text-foreground">{formData.client_name}</strong>?</>
                : <>Add <strong className="text-foreground">{formData.client_name}</strong> as a new customer?</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel
              disabled={saving}
              className="rounded-xl h-11 flex-1 sm:flex-none mt-0"
              onClick={() => { setConfirmOpen(false); setFormOpen(true); }}
            >
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className="rounded-xl h-11 flex-1 sm:flex-none gap-2"
              onClick={handleConfirmed}
            >
              {saving
                ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                : isEditing ? "Yes, Update" : "Yes, Add"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); }}}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.client_name}</strong>?
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
