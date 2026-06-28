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
} from "lucide-react";
import { useConfirm } from "@/lib/confirm";
import { cn } from "@/lib/utils";

type Item = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick?: () => void;
};

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

export default function Profile() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user_data");
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        setUserData(parsed);
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
      navigate("/login");
    }
  };

  // Navigation handler
  const goTo = (path: string) => {
    if (path && path !== "#") {
      navigate(path);
    }
  };

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

        {/* Dashboard & Quick Actions */}
        <Section
          title="Quick Actions"
          items={[
            { icon: LayoutDashboard, label: "Dashboard", onClick: () => goTo("/") },
            { icon: FilePlus, label: "Create Quotation", onClick: () => goTo("/create-quotation") },
            { icon: FileText, label: "Quotation History", onClick: () => goTo("/quotations") },
            { icon: Users, label: "Clients", onClick: () => goTo("/clients") },
          ]}
        />

        {/* Leads & Followups */}
        <Section
          title="Leads & Followups"
          items={[
            { icon: UserPlus, label: "My Leads", onClick: () => goTo("/my-leads") },
            { icon: Users, label: "All Leads", onClick: () => goTo("/all-leads") },
            { icon: PhoneCall, label: "My Today Followup", onClick: () => goTo("/my-today-followup") },
            { icon: ClipboardList, label: "All Followups", onClick: () => goTo("/all-followups") },
          ]}
        />

        {/* Reports */}
        <Section
          title="Reports"
          items={[
            { icon: Package, label: "Low Raw Material Stock", onClick: () => goTo("/reports/low-stock") },
            { icon: ClipboardList, label: "Work Order Status", onClick: () => goTo("/reports/work-order-status") },
          ]}
        />

        {/* Master */}
        <Section
          title="Master"
          items={[
            { icon: Users, label: "Employees", onClick: () => goTo("/employees") },
            { icon: Ruler, label: "Units", onClick: () => goTo("/units") },
            { icon: Tag, label: "Brands", onClick: () => goTo("/brands") },
            { icon: Layers, label: "Raw Material Types", onClick: () => goTo("/raw-material-types") },
            { icon: Layers, label: "Raw Materials", onClick: () => goTo("/raw-materials") },
            { icon: Package, label: "Categories", onClick: () => goTo("/categories") },
            { icon: Package, label: "Products", onClick: () => goTo("/products") },
            { icon: DoorOpen, label: "Rooms", onClick: () => goTo("/rooms") },
            { icon: Package, label: "Packages", onClick: () => goTo("/packages") },
            { icon: FileText, label: "Terms & Conditions", onClick: () => goTo("/terms") },
          ]}
        />

        {/* Location */}
        <Section
          title="Location"
          items={[
            { icon: Map, label: "State Master", onClick: () => goTo("/states") },
            { icon: Building2, label: "City Master", onClick: () => goTo("/cities") },
            { icon: MapPin, label: "Area Master", onClick: () => goTo("/areas") },
          ]}
        />

        {/* Account Settings */}
        <Section
          title="Account Settings"
          items={[
            { icon: Pencil, label: "Edit Profile", hint: "Name, photo, contact", onClick: () => navigate("/profile/edit") },
            { icon: KeyRound, label: "Change Password", hint: "Update your login password" },
            { icon: Bell, label: "Notifications", hint: "Email & in-app alerts" },
            { icon: SettingsIcon, label: "App Settings", hint: "Preferences & defaults", onClick: () => navigate("/settings") },
          ]}
        />

        {/* Support */}
        <Section
          title="Support"
          items={[
            { icon: LifeBuoy, label: "Help Center", hint: "Guides & FAQs" },
            { icon: MessageSquare, label: "Contact Support", hint: "We typically reply within 24h" },
            { icon: ShieldCheck, label: "Privacy Policy" },
            { icon: FileText, label: "Terms & Conditions" },
          ]}
        />

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