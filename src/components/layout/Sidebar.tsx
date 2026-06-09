import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FilePlus, FileText, Users, Package, Boxes, Layers,
  IdCard, DoorOpen, Map, Building2, MapPin, Settings, UserCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FilePlus, label: "Create Quotation", path: "/create-quotation" },
  { icon: FileText, label: "Quotation History", path: "/quotations" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Package, label: "Packages", path: "/packages" },
  { icon: Boxes, label: "Items", path: "/items" },
  { icon: Layers, label: "Raw Materials", path: "/raw-materials" },
  { icon: IdCard, label: "Client Details", path: "/client-details" },
  { icon: DoorOpen, label: "Rooms", path: "/rooms" },
  { icon: Map, label: "State Master", path: "/states" },
  { icon: Building2, label: "City Master", path: "/cities" },
  { icon: MapPin, label: "Area Master", path: "/areas" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen bg-sidebar flex-col transition-all duration-300 sticky top-0 z-30",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
            <span className="text-primary font-display font-bold text-lg">H</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sidebar-foreground font-display font-semibold text-lg leading-tight">Homyns</span>
              <span className="text-sidebar-muted text-[11px] uppercase tracking-wider">CRM & Quotation</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive
                  ? "bg-white text-primary shadow-md font-semibold"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-hover hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sidebar-muted hover:text-white hover:bg-sidebar-hover transition-all"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : (<><ChevronLeft className="w-5 h-5" /><span className="text-sm font-medium">Collapse</span></>)}
        </button>
      </div>
    </aside>
  );
}
