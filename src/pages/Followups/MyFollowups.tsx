// src/pages/Followups/MyFollowups.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { followupService, Followup } from "@/services/followup.service";
import { 
  Search, 
  Loader2, 
  Users, 
  Calendar, 
  Clock, 
  Eye, 
  User, 
  X, 
  PhoneCall, 
  MessageSquare,
  Plus 
} from "lucide-react";

export default function MyFollowups() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filtered, setFiltered] = useState<Followup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const getCompanyId = (): string => {
    try {
      const raw = localStorage.getItem("company_data");
      if (raw) return JSON.parse(raw)?.company_id || "";
    } catch { return ""; }
    return "";
  };

  const getEmployeeId = (): string => {
    try {
      const raw = localStorage.getItem("user_data");
      if (raw) return JSON.parse(raw)?.emp_id || "";
    } catch { return ""; }
    return "";
  };

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const empId = getEmployeeId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        setFollowups([]);
        return;
      }
      const res = await followupService.getFollowups(companyId, 'my', empId);
      console.log('MyFollowups fetchFollowups response:', res);
      
      if (res.status === "success" && Array.isArray(res.data)) {
        setFollowups(res.data);
      } else {
        setFollowups([]);
        if (res.message) {
          toast({ title: "Error", description: res.message, variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error('MyFollowups fetchFollowups error:', e);
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  useEffect(() => {
    let list = [...followups];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.lead_name?.toLowerCase().includes(q) ||
          f.remark?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [followups, search]);

  const getModeColor = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'call': return 'bg-blue-100 text-blue-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      case 'meeting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeIcon = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'call': return <PhoneCall className="h-3 w-3" />;
      case 'whatsapp': return <MessageSquare className="h-3 w-3" />;
      case 'email': return <MessageSquare className="h-3 w-3" />;
      case 'meeting': return <Users className="h-3 w-3" />;
      default: return <PhoneCall className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <MainLayout title="My Followups" subtitle="Followups added by you">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Followups" subtitle="Followups added by you">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search my followups..."
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "followup" : "followups"}
            </Badge>
            <Button 
              onClick={() => navigate("/followup/form")} 
              className="h-10 rounded-xl gap-2 px-4 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Followup
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <PhoneCall className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No followups match your search" : "You haven't added any followups yet"}
            </p>
            {!search && (
              <Button 
                onClick={() => navigate("/followup/form")} 
                variant="outline" 
                size="sm" 
                className="rounded-xl gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add your first followup
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Next Followup</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((followup, idx) => (
                    <tr 
                      key={followup.followup_id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer" 
                      onClick={() => navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{followup.lead_name || "—"}</td>
                      <td className="px-4 py-3">{followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3">
                        <Badge className={getModeColor(followup.mode)}>
                          {getModeIcon(followup.mode)} {followup.mode || "Call"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {followup.next_followup_date ? (
                          <span className="text-amber-600 font-medium">
                            {new Date(followup.next_followup_date).toLocaleDateString()}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                            onClick={(e) => { e.stopPropagation(); navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`); }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filtered.map((followup) => (
                <Card 
                  key={followup.followup_id} 
                  className="p-4 rounded-2xl cursor-pointer" 
                  onClick={() => navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`)}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{followup.lead_name || "Unknown Lead"}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{followup.remark}</p>
                      </div>
                      <Badge className={getModeColor(followup.mode)}>
                        {getModeIcon(followup.mode)} {followup.mode || "Call"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : ""}
                      </span>
                      {followup.next_followup_date && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="h-3 w-3" />
                          Next: {new Date(followup.next_followup_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}