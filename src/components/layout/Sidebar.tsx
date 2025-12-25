import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  Users,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FilePlus, label: "Create Quotation", path: "/create-quotation" },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: Package, label: "Packages", path: "/packages" },
  { icon: FileText, label: "Quotations History", path: "/quotations" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col transition-all duration-300 ease-out sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-muted/30">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-display font-semibold text-lg">
              ID
            </span>
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-sidebar-foreground font-display font-semibold text-lg leading-tight">
                InteriorDesk
              </span>
              <span className="text-sidebar-muted text-xs">
                Quotation System
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )}
              />
              {!collapsed && (
                <span className="font-medium text-sm animate-fade-in">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-sidebar-muted/30">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover transition-all duration-200"
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
