import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Mail, Phone, Pencil, KeyRound } from "lucide-react";
import { useConfirm } from "@/lib/confirm";

export default function Profile() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({ title: "Logout", message: "Are you sure you want to logout?", confirmText: "Logout", destructive: true });
    if (ok) navigate("/login");
  };

  return (
    <MainLayout title="Profile" subtitle="Your account">
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        <Card className="p-6 rounded-2xl border-border">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-display font-semibold">AK</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-display font-semibold text-foreground">Arjun Kapoor</h2>
              <p className="text-sm text-muted-foreground">Senior Interior Designer</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3 text-sm">
                <span className="inline-flex items-center gap-2 text-muted-foreground justify-center sm:justify-start"><Phone className="w-4 h-4" /> +91 98765 43210</span>
                <span className="inline-flex items-center gap-2 text-muted-foreground justify-center sm:justify-start"><Mail className="w-4 h-4" /> arjun@homyns.in</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 rounded-xl justify-start gap-3"><Pencil className="w-4 h-4" /> Edit Profile</Button>
          <Button variant="outline" className="h-12 rounded-xl justify-start gap-3"><KeyRound className="w-4 h-4" /> Change Password</Button>
        </div>

        <Card className="p-6 rounded-2xl border-border">
          <Button variant="destructive" onClick={handleLogout} className="w-full h-12 rounded-xl gap-2">
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </Card>

        <div className="text-center pt-4 pb-2 space-y-1">
          <p className="text-xs text-muted-foreground">Managed by <span className="font-semibold text-foreground">Sunshine Infotech</span></p>
          <p className="text-[11px] text-muted-foreground">Version v1.0.0</p>
        </div>
      </div>
    </MainLayout>
  );
}
