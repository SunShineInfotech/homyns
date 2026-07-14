// src/pages/Followups/TodayFollowups.tsx
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
  Calendar as CalendarIcon,
} from "lucide-react";

export default function TodayFollowups() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [filtered, setFiltered] = useState<Followup[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

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

  // A lead can have many followup rows (its whole history). For "today's
  // followups" we only care about each lead's LATEST entry — if that latest
  // entry's next_followup_date matches the selected date, the lead is due.
  // Older, superseded rows must never re-appear just because they happen to
  // carry a next_followup_date equal to the selected date.
  const getLatestPerLead = (list: Followup[]): Followup[] => {
    // Sort defensively (don't rely on the API's ORDER BY): newest
    // followup_date first, ties broken by newest c_date first.
    const sorted = [...list].sort((a, b) => {
      const aDate = a.followup_date ? new Date(a.followup_date).getTime() : 0;
      const bDate = b.followup_date ? new Date(b.followup_date).getTime() : 0;
      if (bDate !== aDate) return bDate - aDate;
      const aC = a.c_date ? new Date(a.c_date).getTime() : 0;
      const bC = b.c_date ? new Date(b.c_date).getTime() : 0;
      return bC - aC;
    });

    const latestByLead = new Map<string, Followup>();
    sorted.forEach((f) => {
      if (!f.lead_id) return;
      if (!latestByLead.has(f.lead_id)) {
        latestByLead.set(f.lead_id, f);
      }
    });
    return Array.from(latestByLead.values());
  };

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        setFollowups([]);
        return;
      }

      // Fetch the full followup history and filter by next_followup_date
      const res = await followupService.getFollowups(companyId, 'all');
      console.log('TodayFollowups fetchFollowups response:', res);

      if (res.status === "success" && Array.isArray(res.data)) {
        // Step 1: collapse history down to one row per lead — its latest entry.
        const latestPerLead = getLatestPerLead(res.data);

        // Step 2: keep only leads whose latest entry is due on the selected date.
        const todayFollowups = latestPerLead.filter((f) => {
          if (!f.next_followup_date) return false;
          const fDate = new Date(f.next_followup_date).toISOString().split('T')[0];
          return fDate === selectedDate;
        });
        setFollowups(todayFollowups);
      } else {
        setFollowups([]);
        if (res.message) {
          toast({ title: "Error", description: res.message, variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error('TodayFollowups fetchFollowups error:', e);
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

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
          f.remark?.toLowerCase().includes(q) ||
          f.followup_by_name?.toLowerCase().includes(q)
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  if (loading) {
    return (
      <MainLayout title="Today Followups" subtitle="Followups due today">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <MainLayout title="Today Followups" subtitle="Followups due today">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search followups..."
              className="pl-9 h-10 rounded-xl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1.5">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="border-0 bg-transparent h-8 p-0 w-auto text-sm focus:ring-0"
              />
            </div>
            <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "followup" : "followups"}
            </Badge>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No followups match your search" : "No followups due on this date"}
            </p>
            <p className="text-sm text-muted-foreground/70">
              {isToday ? "You have no followups scheduled for today." : "Select a different date to view followups."}
            </p>
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Followup</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">By</th>
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
                      <td className="px-4 py-3">
                        {followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getModeColor(followup.mode)}>
                          {getModeIcon(followup.mode)} {followup.mode || "Call"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{followup.followup_by_name || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/followup/view/${followup.followup_id}?lead_id=${followup.lead_id}`);
                            }}
                            title="View Followup"
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
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">
                          {followup.lead_name || "Unknown Lead"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                          {followup.remark}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last: {followup.followup_date ? new Date(followup.followup_date).toLocaleDateString() : ""}
                          </span>
                          {followup.followup_by_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {followup.followup_by_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <Badge className={getModeColor(followup.mode)}>
                          {getModeIcon(followup.mode)} {followup.mode || "Call"}
                        </Badge>
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                          <Clock className="h-3 w-3 mr-1" /> Due Today
                        </Badge>
                      </div>
                    </div>

                    {followup.status_update && (
                      <div className="pt-2 border-t border-border">
                        <Badge variant="secondary" className="text-xs">
                          Status: {followup.status_update}
                        </Badge>
                      </div>
                    )}
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