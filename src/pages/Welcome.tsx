// src/pages/Welcome.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import {
  FilePlus,
  FileText,
  Users,
  UserCircle,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to safely get permissions array
const getPermissionsArray = (accessPages: any): string[] => {
  if (!accessPages) return [];
  if (Array.isArray(accessPages)) return accessPages.filter(Boolean);
  if (typeof accessPages === 'string') return accessPages.split(',').map((p: string) => p.trim()).filter(Boolean);
  return [];
};

export default function Welcome() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    // Get user data
    try {
      const userRaw = localStorage.getItem("user_data");
      if (userRaw) {
        const userData = JSON.parse(userRaw);
        setUserName(userData.name || "User");
        const perms = getPermissionsArray(userData.access_pages);
        setUserPermissions(perms);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Check if user has specific permissions
  const hasPermission = (perm: string) => userPermissions.includes(perm);

  // Quick action items based on permissions
  const quickActions = [
    {
      icon: FilePlus,
      label: "Create Quotation",
      description: "Start a new quotation",
      path: "/create-quotation",
      color: "bg-blue-500/10 text-blue-600",
      permission: "create-quotation",
    },
    {
      icon: FileText,
      label: "Quotation History",
      description: "View all quotations",
      path: "/quotations",
      color: "bg-purple-500/10 text-purple-600",
      permission: "quotations",
    },
    {
      icon: Users,
      label: "Clients",
      description: "Manage your clients",
      path: "/clients",
      color: "bg-green-500/10 text-green-600",
      permission: "clients",
    },
    {
      icon: UserCircle,
      label: "My Profile",
      description: "View & edit profile",
      path: "/profile",
      color: "bg-orange-500/10 text-orange-600",
      permission: "profile",
    },
  ];

  // Filter actions based on permissions
  const accessibleActions = quickActions.filter(
    action => action.permission === "profile" || hasPermission(action.permission)
  );

  // Get current date
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <MainLayout title="Welcome" subtitle={`${greeting}, ${userName}!`}>
      <div className="max-w-6xl mx-auto space-y-6 pb-6">
        {/* Greeting Card */}
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {greeting}, {userName}! 👋
                </h1>
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground">
                {dateStr}
              </p>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                Welcome to your workspace. Here's a quick overview of what you can do.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
       
       

      
      </div>
    </MainLayout>
  );
}