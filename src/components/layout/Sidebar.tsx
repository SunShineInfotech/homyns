// src/components/layout/Sidebar.tsx
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Users,
  Package,
  BarChart3,
  ClipboardList,
  UserPlus,
  PhoneCall,
  Layers,
  Flag,
  DoorOpen,
  Ruler,
  Loader2, 
  Tag,
  Map,
  Building2,
  MapPin,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  ChevronDown,
  ChevronUp,
  Grid,
  LogOut,
  AlertCircle,
  UserCheck,
  Calendar,
  Repeat,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";

// Define all nav items with their permission keys
const ALL_NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    permission: "dashboard",
  },
  {
    icon: FilePlus,
    label: "Create Quotation",
    path: "/create-quotation",
    permission: "create-quotation",
  },
  {
    icon: FileText,
    label: "Quotation History",
    path: "/quotations",
    permission: "quotations",
  },
  {
    icon: Users,
    label: "Clients",
    path: "/clients",
    permission: "clients",
  },
  {
    icon: Users,
    label: "Employees",
    path: "/employees",
    permission: "employees",
  },
  {
    icon: UserPlus,
    label: "Lead",
    path: "#",
    permission: "lead",
    isParent: true,
    children: [
      {
        icon: UserPlus,
        label: "My Leads",
        path: "/my-leads",
        permission: "my-leads",
      },
      {
        icon: Users,
        label: "All Leads",
        path: "/all-leads",
        permission: "all-leads",
      }
    ],
  },
  {
    icon: UserPlus,
    label: "Followup",
    path: "#",
    permission: "followup",
    isParent: true,
    children: [
      {
        icon: PhoneCall,
        label: "My Followups",
        path: "/my-followups",
        permission: "my-followups",
      },
      {
        icon: ClipboardList,
        label: "All Followups",
        path: "/all-followups",
        permission: "all-followups",
      },
      {
        icon: Calendar,
        label: "Today Followups",
        path: "/today-followups",
        permission: "today-followups",
      },
      {
        icon: ArrowRightLeft,
        label: "Transfer",
        path: "/transfer",
        permission: "transfer",
      },
    ],
  },
  {
    icon: Grid,
    label: "Master",
    path: "#",
    permission: "master",
    isParent: true,
    children: [
      {
        icon: Users,
        label: "Lead Sources",
        path: "/lead-sources",
        permission: "lead-sources",
      },
      {
        icon: Flag,
        label: "Lead Status",
        path: "/lead-statuses",
        permission: "lead-statuses",
      },
      {
        icon: Ruler,
        label: "Units",
        path: "/units",
        permission: "units",
      },
      {
        icon: Tag,
        label: "Brands",
        path: "/brands",
        permission: "brands",
      },
      {
        icon: Layers,
        label: "Raw Material Types",
        path: "/raw-material-types",
        permission: "raw-material-types",
      },
      {
        icon: Layers,
        label: "Raw Materials",
        path: "/raw-materials",
        permission: "raw-materials",
      },
      {
        icon: Package,
        label: "Categories",
        path: "/categories",
        permission: "categories",
      },
      {
        icon: Package,
        label: "Products",
        path: "/products",
        permission: "products",
      },
      {
        icon: DoorOpen,
        label: "Rooms",
        path: "/rooms",
        permission: "rooms",
      },
      {
        icon: Package,
        label: "Packages",
        path: "/packages",
        permission: "packages",
      },
      {
        icon: FileText,
        label: "Terms & Conditions",
        path: "/terms",
        permission: "terms",
      },
    ],
  },
  {
    icon: FolderTree,
    label: "Location",
    path: "#",
    permission: "location",
    isParent: true,
    children: [
      {
        icon: Map,
        label: "State Master",
        path: "/states",
        permission: "states",
      },
      {
        icon: Building2,
        label: "City Master",
        path: "/cities",
        permission: "cities",
      },
      {
        icon: MapPin,
        label: "Area Master",
        path: "/areas",
        permission: "areas",
      },
    ],
  },
  {
    icon: BarChart3,
    label: "Reports",
    path: "#",
    permission: "reports",
    isParent: true,
    children: [
      {
        icon: Package,
        label: "Low Raw Material Stock",
        path: "/reports/low-stock",
        permission: "reports-low-stock",
      },
      {
        icon: ClipboardList,
        label: "Work Order Status",
        path: "/reports/work-order-status",
        permission: "reports-work-order",
      },
    ],
  },
  {
    icon: UserCircle,
    label: "Company Profile",
    path: "/company",
    permission: "company",
  },
  {
    icon: UserCircle,
    label: "How To Use",
    path: "/HowToUse",
    permission: "how-to-use",
  },
];

const API_URL = import.meta.env.VITE_API_URL || "https://sunshineproduct.in/interior_designer/v1_api/";

// Helper function to safely get permissions array
const getPermissionsArray = (accessPages: any): string[] => {
  if (!accessPages) return [];
  if (Array.isArray(accessPages)) return accessPages.filter(Boolean);
  if (typeof accessPages === 'string') return accessPages.split(',').map((p: string) => p.trim()).filter(Boolean);
  return [];
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("Homyns");
  const [companyLogo, setCompanyLogo] = useState("");
  const [userName, setUserName] = useState("");
  const [userLoginCode, setUserLoginCode] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Check user status and permissions
  const checkUserStatus = async () => {
    try {
      const userDataStr = localStorage.getItem("user_data");
      if (!userDataStr) return;

      const userData = JSON.parse(userDataStr);
      const companyDataStr = localStorage.getItem("company_data");
      const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;

      if (!companyData?.company_id || !userData?.emp_id) return;

      const response = await axios.post(`${API_URL}employee.php`, {
        type: 3,
        company_id: companyData.company_id,
      });

      if (response.data.status === "success" && response.data.data) {
        const employees = response.data.data;
        const currentUser = employees.find((e: any) => e.emp_id === userData.emp_id);

        if (currentUser) {
          if (currentUser.status !== "Active" && userData.status === "Active") {
            toast({
              title: "Session Expired",
              description: "Your account has been deactivated. Please contact admin.",
              variant: "destructive",
            });
            handleLogout();
            return;
          }

          const updatedUserData = {
            ...userData,
            status: currentUser.status,
            access_pages: currentUser.access_pages || "",
          };
          localStorage.setItem("user_data", JSON.stringify(updatedUserData));
          
          setUserStatus(currentUser.status);
          const perms = getPermissionsArray(currentUser.access_pages);
          setUserPermissions(perms);
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user data and permissions
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userDataStr = localStorage.getItem("user_data");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUserName(userData.name || "");
          setUserLoginCode(userData.login_code || "");
          setUserStatus(userData.status || "Active");
          
          const perms = getPermissionsArray(userData.access_pages);
          setUserPermissions(perms);
        } else {
          setUserPermissions([]);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();

    const interval = setInterval(checkUserStatus, 30000);
    
    const handleFocus = () => {
      checkUserStatus();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Filter nav items based on permissions
  useEffect(() => {
    const filterNavItems = (items: any[]): any[] => {
      const filtered: any[] = [];

      for (const item of items) {
        const hasPermission = userPermissions.includes(item.permission);

        if (item.isParent && item.children) {
          const filteredChildren = item.children.filter((child: any) => 
            userPermissions.includes(child.permission)
          );

          if (filteredChildren.length > 0) {
            filtered.push({
              ...item,
              children: filteredChildren,
            });
          }
        } else if (hasPermission) {
          filtered.push(item);
        }
      }

      return filtered;
    };

    const filteredItems = filterNavItems(ALL_NAV_ITEMS);
    setNavItems(filteredItems);
  }, [userPermissions]);

  // Load company data
  useEffect(() => {
    const companyDataStr = localStorage.getItem("company_data");
    if (companyDataStr) {
      try {
        const companyData = JSON.parse(companyDataStr);
        if (companyData.company_name) {
          setCompanyName(companyData.company_name);
        }
        if (companyData.logo) {
          setCompanyLogo(companyData.logo);
        }
      } catch (error) {
        console.error("Error parsing company data:", error);
      }
    }
  }, []);

  // Auto-expand menus based on current route
  useEffect(() => {
    const currentPath = location.pathname;

    navItems.forEach((item) => {
      if (item.isParent && item.children) {
        const hasActiveChild = item.children.some(
          (child: any) =>
            currentPath === child.path ||
            currentPath.startsWith(child.path + "/"),
        );

        if (hasActiveChild) {
          setExpandedMenus((prev) => {
            if (!prev.includes(item.label)) {
              return [...prev, item.label];
            }
            return prev;
          });
        }
      }
    });
  }, [location.pathname, navItems]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const isChildActive = (children: any[]) => {
    const currentPath = location.pathname;
    return children.some(
      (child) =>
        currentPath === child.path || currentPath.startsWith(child.path + "/"),
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    toast({ title: "Logged Out", description: "You have been logged out successfully" });
    navigate("/login");
  };

  // Loading state
  if (isLoading) {
    return (
      <aside
        className={cn(
          "hidden md:flex h-screen bg-sidebar flex-col transition-all duration-300 sticky top-0 z-30",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
              <span className="text-primary font-bold text-lg">
                {companyName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sidebar-foreground font-display font-semibold text-lg leading-tight">
                  {companyName || "Homyns"}
                </span>
                <span className="text-sidebar-muted text-[11px] uppercase tracking-wider">
                  CRM & Quotation
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-sidebar-muted" />
        </div>
      </aside>
    );
  }

  // Check if user has ANY permissions
  const hasAnyPermission = userPermissions.length > 0;

  // If user is inactive - show deactivated message with logout only
  if (userStatus === "Inactive") {
    return (
      <aside
        className={cn(
          "hidden md:flex h-screen bg-sidebar flex-col transition-all duration-300 sticky top-0 z-30",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
              <span className="text-primary font-bold text-lg">
                {companyName.charAt(0).toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sidebar-foreground font-display font-semibold text-lg leading-tight">
                  {companyName || "Homyns"}
                </span>
                <span className="text-sidebar-muted text-[11px] uppercase tracking-wider">
                  CRM & Quotation
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sidebar-foreground font-semibold text-lg">Account Deactivated</p>
            <p className="text-sidebar-muted text-sm mt-1">Your account is no longer active</p>
            <p className="text-sidebar-muted text-xs mt-2">Please contact your administrator</p>
          </div>
          <Button
            onClick={handleLogout}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white rounded-xl px-6"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
    );
  }

  // If NO permissions - show only company logo and logout button
  if (!hasAnyPermission) {
    return (
      <aside
        className={cn(
          "hidden md:flex h-screen bg-sidebar flex-col transition-all duration-300 sticky top-0 z-30",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {/* Header with company logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
              {companyLogo ? (
                <img
                  src={`https://sunshineproduct.in/interior_designer/uploadfiles/company/${companyLogo}`}
                  alt={companyName}
                  style={{ width: "35px", height: "auto" }}
                />
              ) : (
                <span className="text-primary font-bold text-lg">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sidebar-foreground font-display font-semibold text-lg leading-tight">
                  {companyName || "Homyns"}
                </span>
                <span className="text-sidebar-muted text-[11px] uppercase tracking-wider">
                  CRM & Quotation
                </span>
              </div>
            )}
          </div>
        </div>

        {/* No Permission Message */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <div className="text-center">
            <p className="text-sidebar-foreground font-semibold text-base">
              No Permissions Assigned
            </p>
            <p className="text-sidebar-muted text-sm mt-1 max-w-[200px] mx-auto">
              You don't have access to any modules. Please contact your administrator.
            </p>
          </div>
        </div>

        {/* Footer with collapse and logout - Show both buttons */}
        <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
          {!collapsed && (
            <div className="px-3 py-2 rounded-xl bg-white/5">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userName || "User"}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {userLoginCode || ""}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition-all"
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Collapse</span>
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2.5 rounded-xl text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // User has permissions - Show full sidebar with navigation items
  return (
    <aside
      className={cn(
        "hidden md:flex h-screen bg-sidebar flex-col transition-all duration-300 sticky top-0 z-30",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
            {companyLogo ? (
              <img
                src={`https://sunshineproduct.in/interior_designer/uploadfiles/company/${companyLogo}`}
                alt={companyName}
                style={{ width: "35px", height: "auto" }}
              />
            ) : (
              <span className="text-primary font-bold text-lg">
                {companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sidebar-foreground font-display font-semibold text-lg leading-tight">
                {companyName || "Homyns"}
              </span>
              <span className="text-sidebar-muted text-[11px] uppercase tracking-wider">
                CRM & Quotation
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          if (item.isParent && item.children) {
            const isExpanded = expandedMenus.includes(item.label);
            const hasActiveChild = isChildActive(item.children);

            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                    "text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-white",
                    hasActiveChild &&
                    "bg-sidebar-hover/50 text-white font-medium",
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm flex-1 text-left">
                        {item.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div className="ml-9 space-y-1 border-l-2 border-white/10 pl-2">
                    {item.children.map((child: any) => {
                      const isActive =
                        location.pathname === child.path ||
                        location.pathname.startsWith(child.path + "/");

                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          end={child.path === "/"}
                          className={({ isActive: navIsActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                              isActive || navIsActive
                                ? "bg-white/10 text-white shadow-md font-semibold"
                                : "text-sidebar-foreground/75 hover:bg-sidebar-hover hover:text-white",
                            )
                          }
                        >
                          <child.icon className="w-4 h-4 shrink-0" />
                          <span className="text-sm">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive: navIsActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                  isActive || navIsActive
                    ? "bg-white text-primary shadow-md font-semibold"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-white",
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-white/5">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userName || "User"}
            </p>
            <p className="text-xs text-sidebar-muted truncate">
              {userLoginCode || ""}
            </p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition-all"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2.5 rounded-xl text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}