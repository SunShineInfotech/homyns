// src/pages/Leads/MyLeads.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { leadService, Lead } from "@/services/lead.service";
import { Search, Pencil, Loader2, Users, Phone, Mail, MapPin, X, Eye } from "lucide-react";

export default function MyLeads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
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

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getCompanyId();
      const empId = getEmployeeId();
      if (!companyId) {
        toast({ title: "Error", description: "Company not found", variant: "destructive" });
        return;
      }
      const res = await leadService.getLeads(companyId, 'my', empId);
      if (res.status === "success" && res.data) {
        setLeads(res.data);
      } else {
        setLeads([]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    let list = [...leads];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.lead_name?.toLowerCase().includes(q) ||
          l.phone1?.includes(q)
      );
    }
    setFiltered(list);
  }, [leads, search]);

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Proposal Sent': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Won': 'bg-emerald-100 text-emerald-800',
      'Lost': 'bg-red-100 text-red-800',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <MainLayout title="My Leads" subtitle="Leads assigned to you">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="My Leads" subtitle="Leads assigned to you">
      <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my leads..."
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              {search ? "No leads match your search" : "No leads assigned to you yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lead) => (
              <Card key={lead.lead_id} className="p-5 rounded-2xl hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{lead.lead_name}</h3>
                    {lead.phone1 && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {lead.phone1}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => navigate(`/lead/view/${lead.lead_id}`)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500" onClick={() => navigate(`/lead/form/${lead.lead_id}`)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {lead.source_name && (
                    <Badge variant="secondary" className="rounded-md text-xs px-2 py-0.5">{lead.source_name}</Badge>
                  )}
                  {lead.status && (
                    <Badge className={`rounded-md text-xs px-2 py-0.5 ${getStatusColor(lead.status_name || lead.status)}`}>
                      {lead.status_name || lead.status}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span>Created: {lead.c_date ? new Date(lead.c_date).toLocaleDateString() : ""}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}