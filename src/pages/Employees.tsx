// src/pages/Masters/Employees.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { employeeService, Employee } from "@/services/employee.service";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  X,
  Eye,
  Key,
  Lock,
} from "lucide-react";

type SortKey = "name" | "login_code" | "email" | "status";
type SortDir = "asc" | "desc";

export default function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'https://sunshineproduct.in/interior_designer/v1_api/';

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { /* ignore */ }
    return "";
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const cid = getCompanyId();
      if (!cid) {
        toast({ title: "Error", description: "Company not found. Please login again.", variant: "destructive" });
        return;
      }
      const res = await employeeService.getEmployees(cid);
      if (res.status === "success" && Array.isArray(res.data)) {
        // Parse access_pages to array for display
        const formattedData = res.data.map((emp: any) => ({
          ...emp,
          access_pages_list: emp.access_pages ? emp.access_pages.split(',').map((p: string) => p.trim()) : []
        }));
        setEmployees(formattedData);
      } else {
        toast({ title: "Error", description: res.message || "Failed to fetch employees", variant: "destructive" });
        setEmployees([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let list = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.login_code?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.phone1?.includes(q)
      );
    }
    list.sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === "name") {
        va = (a.name || "").toLowerCase();
        vb = (b.name || "").toLowerCase();
      } else if (sortKey === "login_code") {
        va = (a.login_code || "").toLowerCase();
        vb = (b.login_code || "").toLowerCase();
      } else if (sortKey === "email") {
        va = (a.email || "").toLowerCase();
        vb = (b.email || "").toLowerCase();
      } else {
        va = (a.status || "").toLowerCase();
        vb = (b.status || "").toLowerCase();
      }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    setFiltered(list);
  }, [employees, search, sortKey, sortDir]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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

  const handleAdd = () => {
    navigate("/employees/form");
  };

  const handleEdit = (id: string) => {
    navigate(`/employees/form/${id}`);
  };

  const handleView = (id: string) => {
    navigate(`/employees/view/${id}`);
  };

  const askDelete = (e: Employee) => {
    setDeleteTarget(e);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.emp_id) return;
    setDeleting(true);
    try {
      const res = await employeeService.deleteEmployee(deleteTarget.emp_id);
      if (res.status === "success") {
        toast({ title: "Success", description: "Employee deleted successfully" });
        setDeleteConfirm(false);
        setDeleteTarget(null);
        await fetchEmployees();
      } else {
        toast({ title: "Error", description: res.message || "Failed to delete", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  // Password change handlers
  const openPasswordDialog = (emp: Employee) => {
    setPasswordTarget(emp);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    // Validate
    if (!newPassword || newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordError("");
    setChangingPassword(true);

    try {
      const res = await employeeService.changePassword(
        passwordTarget!.emp_id!,
        newPassword
      );

      if (res.status === "success") {
        toast({ title: "Success", description: "Password changed successfully" });
        setPasswordDialogOpen(false);
        setPasswordTarget(null);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ title: "Error", description: res.message || "Failed to change password", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.response?.data?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <MainLayout title="Employees" subtitle="Manage employee accounts">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
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
              {filtered.length} {filtered.length === 1 ? "employee" : "employees"}
            </Badge>
            <Button onClick={handleAdd} className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No employees match your search" : "No employees added yet"}
            </p>
            {!search && (
              <Button onClick={handleAdd} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add your first employee
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("name")}
                    >
                      <span className="flex items-center gap-1.5">
                        Name <SortIcon col="name" />
                      </span>
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("login_code")}
                    >
                      <span className="flex items-center gap-1.5">
                        Login Code <SortIcon col="login_code" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Image</th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("email")}
                    >
                      <span className="flex items-center gap-1.5">
                        Email <SortIcon col="email" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                    <th
                      className="px-4 py-3 text-center font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => toggleSort("status")}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Status <SortIcon col="status" />
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((e, idx) => (
                    <tr key={e.emp_id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{e.name}</td>
                      <td className="px-4 py-3 font-mono text-sm">{e.login_code}</td>
                      <td className="px-4 py-3">
                        {e.profile_image ? (
                          <img 
                            src={`${API_URL}../uploadfiles/employee/${e.profile_image}`} 
                            alt={e.name}
                            className="h-10 w-10 object-cover rounded-full border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{e.email || "—"}</td>
                      <td className="px-4 py-3">{e.phone1 || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge 
                          variant={e.status === "Active" ? "success" : "secondary"}
                          className="rounded-md"
                        >
                          {e.status || "Active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                            onClick={() => handleView(e.emp_id!)}
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-500" 
                            onClick={() => openPasswordDialog(e)}
                            title="Change Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                            onClick={() => handleEdit(e.emp_id!)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => askDelete(e)}
                            title="Delete"
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

            <div className="md:hidden space-y-2">
              {filtered.map((e, idx) => (
                <div key={e.emp_id} className="flex items-center gap-3 rounded-2xl border p-4 bg-card">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground">Login: {e.login_code}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={e.status === "Active" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {e.status || "Active"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                      onClick={() => handleView(e.emp_id!)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-500" 
                      onClick={() => openPasswordDialog(e)}
                    >
                      <Key className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" 
                      onClick={() => handleEdit(e.emp_id!)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => askDelete(e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Change password for <strong>{passwordTarget?.name}</strong> ({passwordTarget?.login_code})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="newPassword">New Password <span className="text-destructive">*</span></Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  className="h-11 rounded-xl pl-10"
                  placeholder="Enter new password (min 4 characters)"
                  disabled={changingPassword}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  className="h-11 rounded-xl pl-10"
                  placeholder="Confirm new password"
                  disabled={changingPassword}
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-11 flex-1 sm:flex-none"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPasswordTarget(null);
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError("");
              }}
              disabled={changingPassword}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl h-11 flex-1 sm:flex-none gap-2"
              onClick={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Changing...</>
              ) : (
                <><Key className="h-4 w-4" /> Change Password</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm}
        onOpenChange={(o) => { if (!o && !deleting) { setDeleteConfirm(false); setDeleteTarget(null); }}}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>?
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