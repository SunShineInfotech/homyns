// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LogOut, Mail, Phone, Pencil, KeyRound, Bell, Settings as SettingsIcon,
  LifeBuoy, MessageSquare, ShieldCheck, FileText, ChevronRight, ExternalLink,
  LayoutDashboard,
  FilePlus,
  Users,
  Package,
  BarChart3,
  ClipboardList,
  UserPlus,
  PhoneCall,
  Layers,
  DoorOpen,
  Ruler,
  Tag,
  Map,
  Building2,
  MapPin,
  UserCircle,
  FolderTree,
  Grid,
  Calendar,
  ArrowRightLeft,
  UserCheck,
} from "lucide-react";
import { useConfirm } from "@/lib/confirm";
import { cn } from "@/lib/utils";

type Item = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick?: () => void;
  permission?: string;
  path?: string;
};

// Define all sections with permissions - using path instead of onClick
const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "Quick Actions",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: "dashboard" },
      { icon: FilePlus, label: "Create Quotation", path: "/create-quotation", permission: "create-quotation" },
      { icon: FileText, label: "Quotation History", path: "/quotations", permission: "quotations" },
      { icon: Users, label: "Clients", path: "/clients", permission: "clients" },
    ]
  },
  {
    title: "Leads & Followups",
    items: [
      { icon: UserPlus, label: "My Leads", path: "/my-leads", permission: "my-leads" },
      { icon: Users, label: "All Leads", path: "/all-leads", permission: "all-leads" },
      { icon: PhoneCall, label: "My Followups", path: "/my-followups", permission: "my-followups" },
      { icon: ClipboardList, label: "All Followups", path: "/all-followups", permission: "all-followups" },
      { icon: Calendar, label: "Today Followups", path: "/today-followups", permission: "today-followups" },
      { icon: ArrowRightLeft, label: "Transfer", path: "/transfer", permission: "transfer" },
    ]
  },
  {
    title: "Reports",
    items: [
      { icon: Package, label: "Low Raw Material Stock", path: "/reports/low-stock", permission: "reports-low-stock" },
      { icon: ClipboardList, label: "Work Order Status", path: "/reports/work-order-status", permission: "reports-work-order" },
    ]
  },
  {
    title: "Master",
    items: [
      { icon: Users, label: "Employees", path: "/employees", permission: "employees" },
      { icon: Ruler, label: "Units", path: "/units", permission: "units" },
      { icon: Tag, label: "Brands", path: "/brands", permission: "brands" },
      { icon: Layers, label: "Raw Material Types", path: "/raw-material-types", permission: "raw-material-types" },
      { icon: Layers, label: "Raw Materials", path: "/raw-materials", permission: "raw-materials" },
      { icon: Package, label: "Categories", path: "/categories", permission: "categories" },
      { icon: Package, label: "Products", path: "/products", permission: "products" },
      { icon: DoorOpen, label: "Rooms", path: "/rooms", permission: "rooms" },
      { icon: Package, label: "Packages", path: "/packages", permission: "packages" },
      { icon: FileText, label: "Terms & Conditions", path: "/terms", permission: "terms" },
    ]
  },
  {
    title: "Location",
    items: [
      { icon: Map, label: "State Master", path: "/states", permission: "states" },
      { icon: Building2, label: "City Master", path: "/cities", permission: "cities" },
      { icon: MapPin, label: "Area Master", path: "/areas", permission: "areas" },
    ]
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [userData, setUserData] = useState<any>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user_data");
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        setUserData(parsed);
        if (parsed.access_pages) {
          const perms = parsed.access_pages.split(',').map((p: string) => p.trim()).filter(Boolean);
          setUserPermissions(perms);
        } else {
          setUserPermissions([]);
        }
      }
    } catch (error) {
      console.error("Error parsing user_data:", error);
    }
  }, []);

  const getUserInitials = (): string => {
    if (!userData?.name) return "U";
    const nameParts = userData.name.trim().split(" ");
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  const getUserName = (): string => {
    return userData?.name || "User";
  };

  const getUserEmail = (): string => {
    return userData?.email || "";
  };

  const getUserPhone = (): string => {
    return userData?.phone1 || "";
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Logout",
      message: "Are you sure you want to logout of Homyns?",
      confirmText: "Logout",
      destructive: true,
    });
    if (ok) {
      localStorage.removeItem("user_data");
      localStorage.removeItem("auth_token");
      navigate("/login");
    }
  };

  // Navigation handler
  const goToPath = (path: string) => {
    if (path && path !== "#") {
      navigate(path);
    }
  };

  // Check if user has any permissions
  const hasAnyPermission = userPermissions.length > 0;

  // Filter sections based on permissions and create onClick handlers
  const filteredSections = SECTIONS.map(section => ({
    ...section,
    items: section.items
      .filter(item => {
        // If no permissions, only show items without permission requirement
        if (userPermissions.length === 0) return false;
        // Check if user has permission for this item
        return userPermissions.includes(item.permission);
      })
      .map(item => ({
        ...item,
        // Create onClick handler that uses the navigate function
        onClick: () => goToPath(item.path || "#")
      }))
  })).filter(section => section.items.length > 0);

  // Always show Account Settings section
  const accountSettingsSection = {
    title: "Account Settings",
    items: [
      { icon: Pencil, label: "Edit Profile", hint: "Name, photo, contact", onClick: () => navigate("/profile/edit") },
      { icon: KeyRound, label: "Change Password", hint: "Update your login password" },
      { icon: Bell, label: "Notifications", hint: "Email & in-app alerts" },
      { icon: SettingsIcon, label: "App Settings", hint: "Preferences & defaults", onClick: () => navigate("/settings") },
    ]
  };

  // Always show Support section
  const supportSection = {
    title: "Support",
    items: [
      { icon: LifeBuoy, label: "Help Center", hint: "Guides & FAQs" },
      { icon: MessageSquare, label: "Contact Support", hint: "We typically reply within 24h" },
      { icon: ShieldCheck, label: "Privacy Policy" },
      { icon: FileText, label: "Terms & Conditions" },
    ]
  };

  // Combine sections
  const finalSections = [...filteredSections];
  // Uncomment below if you want to show Account Settings and Support sections
  // , accountSettingsSection, supportSection

  return (
    <MainLayout title="Profile" subtitle="Account & app preferences">
      <div className="max-w-2xl mx-auto space-y-5 pb-24 md:pb-6 animate-fade-in">
        {/* Identity card */}
        <Card className="p-5 rounded-2xl border-border bg-gradient-to-br from-primary/5 via-card to-card">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-4 ring-background shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-display font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-display font-semibold text-foreground truncate">
                {getUserName()}
              </h2>
              <p className="text-xs text-muted-foreground">Employee</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                {getUserPhone() && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {getUserPhone()}
                  </span>
                )}
                {getUserEmail() && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {getUserEmail()}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="outline"
              className="rounded-xl shrink-0"
              onClick={() => navigate("/profile/edit")}
              aria-label="Edit profile"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* No permissions message */}
        {!hasAnyPermission && (
          <Card className="rounded-2xl border-border p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">No Permissions Assigned</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You don't have access to any modules. Please contact your administrator.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Sections with permission filtering */}
        {finalSections.map((section, idx) => {
          // Skip empty sections
          if (section.items.length === 0) return null;

          return (
            <Section key={idx} title={section.title} items={section.items} />
          );
        })}

        {/* About */}
        <div className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            About
          </p>
          <Card className="rounded-2xl border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Managed by</p>
                <p className="text-sm font-semibold text-foreground">Sunshine Infotech</p>
              </div>
              <a
                href="https://sunshineinfotech.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                sunshineinfotech.in <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Version</p>
              <p className="text-xs font-mono text-foreground">v1.0.0</p>
            </div>
          </Card>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className={cn(
            "w-full h-12 rounded-2xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
          )}
        >
          <LogOut className="w-5 h-5" /> Logout
        </Button>

        <p className="text-center text-[11px] text-muted-foreground pt-1">
          © 2026 Homyns. All rights reserved.
        </p>
      </div>
    </MainLayout>
  );
}

// Section component
function Section({ title, items }: { title: string; items: Item[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <Card className="rounded-2xl border-border overflow-hidden divide-y divide-border">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={it.onClick}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition"
          >
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <it.icon className="w-4.5 h-4.5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-foreground">{it.label}</span>
              {it.hint && <span className="block text-xs text-muted-foreground">{it.hint}</span>}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </Card>
    </div>
  );
}