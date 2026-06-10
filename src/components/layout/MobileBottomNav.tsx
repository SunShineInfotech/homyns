import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, Plus, Users, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "Quotes", path: "/quotations" },
  { icon: null, label: "Create", path: "/create-quotation", center: true },
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: UserCircle, label: "More", path: "/profile" },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="relative pointer-events-auto">
        {/* SVG curved background */}
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 w-full h-[78px] drop-shadow-[0_-8px_20px_rgba(15,23,42,0.12)]"
          aria-hidden
        >
          <path
            d="M0,16 L150,16 C165,16 170,0 200,0 C230,0 235,16 250,16 L400,16 L400,80 L0,80 Z"
            fill="hsl(var(--card))"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
          />
        </svg>

        {/* Floating + button */}
        <button
          onClick={() => navigate("/create-quotation")}
          aria-label="Create Quotation"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -top-2 w-14 h-14 rounded-full gradient-primary shadow-[0_10px_24px_-6px_hsl(var(--primary)/0.6)] flex items-center justify-center transition-transform active:scale-95",
            pathname === "/create-quotation" && "scale-105"
          )}
        >
          <Plus className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
        </button>

        {/* Nav row */}
        <nav className="relative grid grid-cols-5 h-[78px] pt-3 pb-2 safe-bottom">
          {items.map((it) => {
            if (it.center) {
              return (
                <div key={it.path} className="flex items-end justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground pb-0.5">
                    {it.label}
                  </span>
                </div>
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
                    "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                    <span>{it.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
