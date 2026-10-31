// src/pages/Settings/Company.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { companyService, Company } from "@/services/company.service";
import { 
  Plus, Search, Pencil, Trash2, Loader2, Building2, 
  ChevronUp, ChevronDown, ChevronsUpDown, X, 
  Phone, Mail, MapPin, Calendar, CreditCard, Globe, UserRound 
} from "lucide-react";

type SortKey = "company_name" | "company_code" | "email";
type SortDir = "asc" | "desc";

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

export default function CompanySettings() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filtered, setFiltered] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("company_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  // User and permissions
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userCompanyId, setUserCompanyId] = useState<string>("");
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false); // emp_id 1 or 2

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "";

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.company_id || "";
      }
      return "";
    } catch {
      /* ignore */
    }
    return "";
  };

  const getUserData = (): UserData | null => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) {
        return JSON.parse(raw);
      }
      return null;
    } catch {
      /* ignore */
    }
    return null;
  };

  // Check user permissions on mount
  useEffect(() => {
    const companyId = getCompanyId();
    setUserCompanyId(companyId);

    const user = getUserData();
    setUserData(user);

    // Check if user is admin (emp_id 1 or 2)
    const admin = user?.emp_id === "1" || user?.emp_id === "2";
    setIsAdminUser(admin);

    console.log("User Data:", user);
    console.log("Is Admin User (emp_id 1 or 2):", admin);
    console.log("Company ID:", companyId);
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        toast({
          title: "Error",
          description: "Company not found. Please login again.",
          variant: "destructive",
        });
        return;
      }

      // Admin users (emp_id 1 or 2) can see ALL companies
      if (isAdminUser) {
        const res = await companyService.getAllCompanies();
        if (res.status === "success" && res.data) {
          setCompanies(res.data);
        } else {
          toast({
            title: "Error",
            description: res.message || "Failed to fetch companies",
            variant: "destructive",
          });
          setCompanies([]);
        }
      } else {
        // Normal users - fetch only their company
        const res = await companyService.getCompany(companyId);
        if (res.status === "success" && res.data) {
          setCompanies([res.data]);
        } else {
          toast({
            title: "Error",
            description: res.message || "Failed to fetch company details",
            variant: "destructive",
          });
          setCompanies([]);
        }
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [isAdminUser]);

  useEffect(() => {
    if (userData !== null) {
      fetchCompanies();
    }
  }, [fetchCompanies, userData]);

  useEffect(() => {
    let list = [...companies];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.company_name?.toLowerCase().includes(q) ||
          c.owner_name?.toLowerCase().includes(q) ||
          c.owner_employee_code?.toLowerCase().includes(q) ||
          c.employee_number?.toLowerCase().includes(q) ||
          c.company_code?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q),
      );
    }
    list.sort((a, b) => {
      let va = "";
      let vb = "";
      if (sortKey === "company_name") {
        va = (a.company_name || "").toLowerCase();
        vb = (b.company_name || "").toLowerCase();
      } else if (sortKey === "company_code") {
        va = (a.company_code || "").toLowerCase();
        vb = (b.company_code || "").toLowerCase();
      } else {
        va = (a.email || "").toLowerCase();
        vb = (b.email || "").toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [companies, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey !== col ? (
      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
    ) : sortDir === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );

  const handleAdd = () => {
    // Only admin users (emp_id 1 or 2) can add new companies
    if (!isAdminUser) {
      toast({
        title: "Access Denied",
        description: "Only admin users can add new companies",
        variant: "destructive",
      });
      return;
    }
    navigate("/company/form");
  };

  const handleEdit = (company: Company) => {
    // Admin users (emp_id 1 or 2) can edit ALL companies
    // Normal users can only edit their OWN company
    if (!isAdminUser && company.company_id !== userCompanyId) {
      toast({
        title: "Access Denied",
        description: "You can only edit your own company",
        variant: "destructive",
      });
      return;
    }
    navigate(`/company/form/${company.company_id}`);
  };

  const askDelete = (company: Company) => {
    // Only admin users (emp_id 1 or 2) can delete
    if (!isAdminUser) {
      toast({
        title: "Access Denied",
        description: "Only admin users can delete companies",
        variant: "destructive",
      });
      return;
    }
    // Prevent deleting company_id = 1 (master admin company)
    if (company.company_id === "1") {
      toast({
        title: "Access Denied",
        description: "Cannot delete the master admin company",
        variant: "destructive",
      });
      return;
    }
    setDeleteTarget(company);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.company_id) return;
    setDeleting(true);
    try {
      const res = await companyService.deleteCompany(deleteTarget.company_id);
      if (res.status === "success") {
        toast({
          title: "Success",
          description: "Company deleted successfully",
        });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchCompanies();
      } else {
        toast({
          title: "Error",
          description: res.message || "Failed to delete",
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
      setDeleting(false);
    }
  };

  // Helper to check if user can edit a specific company
  const canEdit = (company: Company) => {
    return isAdminUser || company.company_id === userCompanyId;
  };

  // Helper to check if user can delete a specific company
  const canDelete = (company: Company) => {
    return isAdminUser && company.company_id !== "1";
  };

  if (loading) {
    return (
      <MainLayout
        title="Company Settings"
        subtitle="Manage company information"
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Company Settings"
      subtitle={
        isAdminUser ? "Manage all companies" : "Manage your company information"
      }
    >
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-display font-semibold text-foreground">
                {isAdminUser ? "All Companies" : "Company Profile"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAdminUser
                  ? "Manage all companies in the system"
                  : "View and manage your company details"}
              </p>
            </div>
            {isAdminUser && (
              <Badge
                variant="default"
                className="ml-2 bg-primary/10 text-primary border-primary/20"
              >
                Admin Access
              </Badge>
            )}
          </div>
          {/* Only show Add Company button for admin users (emp_id 1 or 2) */}
          {isAdminUser && (
            <Button
              onClick={handleAdd}
              className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          )}
        </div>

        {/* Search - Only show for admin users with multiple companies */}
        {isAdminUser && companies.length > 1 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
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
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {isAdminUser ? "No companies found" : "No company found"}
            </p>
            {isAdminUser && (
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" /> Add Company
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((company) => (
              <Card
                key={company.company_id}
                className="p-6 bg-card border-border shadow-soft rounded-2xl hover:shadow-elevated transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  {/* Logo */}
                  <div className="flex flex-col items-center md:items-start">
                    {company.logo ? (
                      <img
                        src={`${API_URL}../uploadfiles/company/${company.logo}`}
                        alt={company.company_name}
                        className="h-24 w-24 object-cover rounded-xl border shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                        <Building2 className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className="mt-2 rounded-lg px-3 py-0.5 text-xs"
                    >
                      {company.company_code}
                    </Badge>
                    {company.company_id === "1" && (
                      <Badge className="mt-1 rounded-lg px-2 py-0.5 text-xs bg-primary/10 text-primary border-primary/20">
                        Master Admin
                      </Badge>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {company.company_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {company.company_id}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {/* Show Edit button only if user can edit this company */}
                        {canEdit(company) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500"
                            onClick={() => handleEdit(company)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {/* Show Delete button only for admin users and not company_id 1 */}
                        {canDelete(company) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(company)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {company.owner_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>Owner: {company.owner_name}</span>
                        </div>
                      )}
                      {company.owner_employee_code && (
                        <div className="flex items-center gap-2 text-sm">
                          <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>Employee Code: {company.owner_employee_code}</span>
                        </div>
                      )}
                      {company.employee_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>Employee No.: {company.employee_number}</span>
                        </div>
                      )}
                      {company.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{company.email}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {company.phone2 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{company.phone2}</span>
                        </div>
                      )}
                      {company.whatsapp_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>WhatsApp: {company.whatsapp_number}</span>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a
                            href={
                              company.website.startsWith("http")
                                ? company.website
                                : `https://${company.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                      {company.gst_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>GST: {company.gst_number}</span>
                        </div>
                      )}
                      {company.company_expiry_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>
                            Expiry:{" "}
                            {new Date(
                              company.company_expiry_date,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {company.address && (
                      <div className="flex items-start gap-2 text-sm pt-2 border-t border-border">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {company.address}
                        </span>
                      </div>
                    )}

                    {company.c_date && (
                      <div className="pt-1">
                        <Badge
                          variant="secondary"
                          className="rounded-lg text-xs"
                        >
                          Added:{" "}
                          {new Date(company.c_date).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => {
          if (!o && !deleting) {
            setDeleteConfirm(false);
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                {deleteTarget?.company_name}
              </strong>
              ? This action cannot be undone.
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
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Yes, Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
