import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, Plus, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "Quotations", path: "/quotations" },
  { icon: null, label: "Create", path: "/create-quotation", center: true },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="px-3 pb-3 pt-1 safe-bottom pointer-events-auto">
        <nav className="relative mx-auto max-w-md bg-card/95 backdrop-blur-xl border border-border rounded-[28px] shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25)]">
          <div className="grid grid-cols-5 h-16 relative">
            {items.map((it) => {
              if (it.center) {
                const active = pathname === it.path;
                return (
                  <button
                    key={it.path}
                    onClick={() => navigate(it.path)}
                    className="flex items-center justify-center"
                    aria-label="Create Quotation"
                  >
                    <span
                      className={cn(
                        "absolute -top-7 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full gradient-primary shadow-[0_10px_30px_-6px_hsl(var(--primary)/0.55)] flex items-center justify-center ring-[6px] ring-background transition-transform active:scale-95",
                        active && "scale-105"
                      )}
                    >
                      <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
                    </span>
                    <span className="absolute bottom-1.5 text-[10px] font-medium text-muted-foreground">
                      Create
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
                      "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition rounded-2xl mx-1",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("w-5 h-5 transition", isActive && "scale-110")} />
                      <span>{it.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
