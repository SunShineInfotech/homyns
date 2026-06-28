import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Boxes,
  Layers,
  Flag,
  IdCard,
  DoorOpen,
  Ruler,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Main nav items with sub-items
const navItems = [
  // ================= Dashboard =================
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
  },

  // ================= Quotation =================
  {
    icon: FilePlus,
    label: "Create Quotation",
    path: "/create-quotation",
  },
  {
    icon: FileText,
    label: "Quotation History",
    path: "/quotations",
  },

  // ================= CRM =================
  {
    icon: Users,
    label: "Clients",
    path: "/clients",
  },

  {
    icon: UserPlus,
    label: "Lead & Followup",
    path: "#",
    isParent: true,
    children: [
      {
        icon: UserPlus,
        label: "My Leads",
        path: "/my-leads",
      },
      {
        icon: Users,
        label: "All Leads",
        path: "/all-leads",
      },
      {
        icon: PhoneCall,
        label: "My Today Followup",
        path: "/my-today-followup",
      },
      {
        icon: ClipboardList,
        label: "All Followups",
        path: "/all-followups",
      },
    ],
  },

  // ================= Inventory =================
  {
    icon: Grid,
    label: "Master",
    path: "#",
    isParent: true,
    children: [
      // CRM Masters
      {
        icon: Users,
        label: "Employees",
        path: "/employees",
      },
      {
        icon: Users,
        label: "Lead Sources",
        path: "/lead-sources",
      },
      {
        icon: Flag,
        label: "Lead Status",
        path: "/lead-statuses",
      },

      // Product Masters
      {
        icon: Ruler,
        label: "Units",
        path: "/units",
      },
      {
        icon: Tag,
        label: "Brands",
        path: "/brands",
      },
      {
        icon: Layers,
        label: "Raw Material Types",
        path: "/raw-material-types",
      },
      {
        icon: Layers,
        label: "Raw Materials",
        path: "/raw-materials",
      },
      {
        icon: Package,
        label: "Categories",
        path: "/categories",
      },
      {
        icon: Package,
        label: "Products",
        path: "/products",
      },

      // Quotation Masters
      {
        icon: DoorOpen,
        label: "Rooms",
        path: "/rooms",
      },
      {
        icon: Package,
        label: "Packages",
        path: "/packages",
      },
      {
        icon: FileText,
        label: "Terms & Conditions",
        path: "/terms",
      },
    ],
  },

  // ================= Location =================
  {
    icon: FolderTree,
    label: "Location",
    path: "#",
    isParent: true,
    children: [
      {
        icon: Map,
        label: "State Master",
        path: "/states",
      },
      {
        icon: Building2,
        label: "City Master",
        path: "/cities",
      },
      {
        icon: MapPin,
        label: "Area Master",
        path: "/areas",
      },
    ],
  },

  // ================= Reports =================
  {
    icon: BarChart3,
    label: "Reports",
    path: "#",
    isParent: true,
    children: [
      {
        icon: Package,
        label: "Low Raw Material Stock",
        path: "/reports/low-stock",
      },
      {
        icon: ClipboardList,
        label: "Work Order Status",
        path: "/reports/work-order-status",
      },
    ],
  },

  // ================= Settings =================
  {
    icon: UserCircle,
    label: "Company Profile",
    path: "/company",
  },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Auto-expand menus based on current route
  useEffect(() => {
    const currentPath = location.pathname;

    // Check each parent item
    navItems.forEach((item) => {
      if (item.isParent && item.children) {
        // Check if any child path matches current route
        const hasActiveChild = item.children.some(
          (child) =>
            currentPath === child.path ||
            currentPath.startsWith(child.path + "/"),
        );

        if (hasActiveChild) {
          // Expand this menu if not already expanded
          setExpandedMenus((prev) => {
            if (!prev.includes(item.label)) {
              return [...prev, item.label];
            }
            return prev;
          });
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  // Check if any child is active for a parent item
  const isChildActive = (children: any[]) => {
    const currentPath = location.pathname;
    return children.some(
      (child) =>
        currentPath === child.path || currentPath.startsWith(child.path + "/"),
    );
  };

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
            <img
              src="https://homyns.com//images/favicons/HOMYNS-LOGO-19.png"
              alt="Logo"
              style={{ width: "30px", height: "30px" }}
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sidebar-foreground font-display font-semibold text-lg leading-tight">
                Homyns
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
          // Parent item with children
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
                    {item.children.map((child) => {
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

          // Regular nav item
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

      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition-all"
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
      </div>
    </aside>
  );
}
