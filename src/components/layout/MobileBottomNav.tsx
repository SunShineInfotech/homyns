// src/components/layout/MobileBottomNav.tsx
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, Plus, Users, UserCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Define all navigation items with permissions
const ALL_ITEMS = [
  { icon: Home, label: "Home", path: "/", permission: "dashboard" },
  { icon: FileText, label: "Quotes", path: "/quotations", permission: "quotations" },
  { icon: null, label: "", path: "/create-quotation", center: true, permission: "create-quotation" },
  { icon: Users, label: "Clients", path: "/clients", permission: "clients" },
  { icon: UserCircle, label: "Profile", path: "/profile", permission: "profile" },
];

// Helper function to safely get permissions array
const getPermissionsArray = (accessPages: any): string[] => {
  if (!accessPages) return [];
  if (Array.isArray(accessPages)) return accessPages.filter(Boolean);
  if (typeof accessPages === 'string') return accessPages.split(',').map((p: string) => p.trim()).filter(Boolean);
  return [];
};

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user permissions
  useEffect(() => {
    const loadPermissions = () => {
      try {
        const userDataStr = localStorage.getItem("user_data");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const perms = getPermissionsArray(userData.access_pages);
          setUserPermissions(perms);
        } else {
          setUserPermissions([]);
        }
      } catch (error) {
        console.error("Error loading user permissions:", error);
        setUserPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Filter nav items based on permissions
  useEffect(() => {
    // Profile is always accessible
    const filteredItems = ALL_ITEMS.filter(item => {
      // Profile always shows
      if (item.permission === "profile") return true;
      // If no permissions set, only show profile
      if (userPermissions.length === 0) return false;
      // Check if user has permission for this item
      return userPermissions.includes(item.permission);
    });

    setNavItems(filteredItems);
  }, [userPermissions]);

  const isCreateActive = pathname.startsWith("/create-quotation");

  // Don't show anything if loading
  if (isLoading) {
    return null;
  }

  // Don't show nav if only profile is accessible (or no items)
  const hasNavigationItems = navItems.some(item => !item.center && item.permission !== "profile");
  if (!hasNavigationItems && navItems.length <= 1) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="relative mx-3 mb-3 bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full" />

        <nav className="flex items-center justify-around h-16 px-2 safe-bottom">
          {navItems.map((it) => {
            if (it.center) {
              return (
                <div key={it.path} className="relative -mt-8 flex items-center justify-center">
                  <button
                    onClick={() => navigate("/create-quotation/client")}
                    aria-label="Create Quotation"
                    className={cn(
                      "w-14 h-14 rounded-2xl shadow-[0_8px_25px_rgba(99,102,241,0.4)] flex items-center justify-center transition-all duration-300",
                      "bg-gradient-to-br from-primary to-primary/90 hover:shadow-[0_8px_30px_rgba(99,102,241,0.5)] hover:scale-105 active:scale-95",
                      isCreateActive && "ring-4 ring-primary/30"
                    )}
                  >
                    <div className="relative">
                      <Plus className="w-7 h-7 text-white" strokeWidth={3} />
                      {isCreateActive && (
                        <Sparkles className="absolute -top-1 -right-3 w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                      )}
                    </div>
                  </button>
                </div>
              );
            }

            const Icon = it.icon!;
            const isActive = pathname === it.path || 
              (it.path !== "/" && pathname.startsWith(it.path));

            return (
              <NavLink
                key={it.path}
                to={it.path}
                end={it.path === "/"}
                className={({ isActive: navIsActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 min-w-[50px]",
                    isActive || navIsActive
                      ? "text-primary"
                      : "text-muted-foreground/70 hover:text-foreground"
                  )
                }
              >
                {({ isActive: navIsActive }) => {
                  const active = isActive || navIsActive;
                  return (
                    <>
                      <div className="relative">
                        <div className={cn(
                          "p-2 rounded-xl transition-all duration-200",
                          active && "bg-primary/10"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5 transition-all duration-200",
                            active && "scale-110"
                          )} />
                        </div>
                        {active && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium transition-all duration-200",
                        active && "font-semibold"
                      )}>
                        {it.label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}