import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export default function Settings() {
  return (
    <MainLayout title="Settings" subtitle="Manage your workspace preferences">
      <div className="space-y-5 max-w-3xl animate-fade-in">
        <Card className="p-5 md:p-6 rounded-2xl border-border space-y-4">
          <h3 className="font-display font-semibold text-lg">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Company Name</Label><Input defaultValue="Homyns Interiors" className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>GST Number</Label><Input defaultValue="27AABCH1234D1Z2" className="h-11 rounded-xl mt-1.5" /></div>
            <div className="md:col-span-2"><Label>Address</Label><Input defaultValue="Mumbai, Maharashtra" className="h-11 rounded-xl mt-1.5" /></div>
          </div>
        </Card>

        <Card className="p-5 md:p-6 rounded-2xl border-border space-y-4">
          <h3 className="font-display font-semibold text-lg">Notifications</h3>
          <div className="flex items-center justify-between"><div><Label>Email notifications</Label><p className="text-xs text-muted-foreground">Receive quotation status updates by email</p></div><Switch defaultChecked /></div>
          <div className="flex items-center justify-between"><div><Label>SMS alerts</Label><p className="text-xs text-muted-foreground">Get critical alerts via SMS</p></div><Switch /></div>
          <div className="flex items-center justify-between"><div><Label>Draft reminders</Label><p className="text-xs text-muted-foreground">Daily reminder for pending drafts</p></div><Switch defaultChecked /></div>
        </Card>

        <Card className="p-5 md:p-6 rounded-2xl border-border space-y-4">
          <h3 className="font-display font-semibold text-lg">Tax & Currency</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Default Currency</Label><Input defaultValue="INR (₹)" className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>Default GST %</Label><Input defaultValue="18" className="h-11 rounded-xl mt-1.5" /></div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
