import { NavLink, useNavigate } from "react-router-dom";
import { Home, FileText, Plus, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "Quotations", path: "/quotations" },
  { icon: null, label: "Create", path: "/create-quotation", center: true },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="grid grid-cols-5 h-16 relative">
        {items.map((it) => {
          if (it.center) {
            return (
              <button
                key={it.path}
                onClick={() => navigate(it.path)}
                className="flex items-center justify-center"
                aria-label="Create Quotation"
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center ring-4 ring-card">
                  <Plus className="w-7 h-7 text-primary-foreground" />
                </span>
              </button>
            );
          }
          const Icon = it.icon!;
          return (
            <NavLink
              key={it.path}
              to={it.path}
              end={it.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{it.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
