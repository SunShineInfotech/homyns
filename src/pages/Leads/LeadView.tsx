// src/pages/Leads/LeadView.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { leadService, Lead } from "@/services/lead.service";
import { followupService, Followup } from "@/services/followup.service";
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Flag,
  Users,
  DollarSign,
  FileText,
  Clock,
  Calendar,
  MessageSquare,
  PhoneCall,
} from "lucide-react";

export default function LeadView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFollowups, setLoadingFollowups] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setLoadingFollowups(true);
      try {
        // Fetch lead details
        const leadRes = await leadService.getLead(id);
        if (leadRes.status === "success" && leadRes.data) {
          setLead(leadRes.data);
        } else {
          toast({ title: "Error", description: "Failed to fetch lead", variant: "destructive" });
          navigate("/all-leads");
          return;
        }

        // Fetch followups
        const followupRes = await followupService.getLeadFollowups(id);
        if (followupRes.status === "success" && followupRes.data) {
          setFollowups(followupRes.data);
        }
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      } finally {
        setLoading(false);
        setLoadingFollowups(false);
      }
    };

    fetchData();
  }, [id, navigate]);

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
      <MainLayout title="Lead Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!lead) return null;

  return (
    <MainLayout title={lead.lead_name || "Lead Details"} subtitle="View lead information">
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
        <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate("/all-leads")}>
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Button>

        {/* Lead Info */}
        <Card className="p-6 rounded-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{lead.lead_name}</h2>
              {lead.status && (
                <Badge className={`mt-1 ${getStatusColor(lead.status_name || lead.status)}`}>
                  {lead.status_name || lead.status}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/lead/form/${lead.lead_id}`)}>
                Edit
              </Button>
              <Button size="sm" className="rounded-xl" onClick={() => navigate(`/followup/form?lead_id=${lead.lead_id}`)}>
                <PhoneCall className="h-4 w-4 mr-1" /> Add Followup
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {lead.phone1 && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{lead.phone1}</span>
                {lead.phone2 && <span className="text-muted-foreground">| {lead.phone2}</span>}
              </div>
            )}
            {lead.whatsapp_number && (
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>WhatsApp: {lead.whatsapp_number}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{lead.email}</span>
              </div>
            )}
            {lead.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{lead.address}</span>
              </div>
            )}
            {lead.source_name && (
              <div className="flex items-center gap-2 text-sm">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span>Source: {lead.source_name}</span>
              </div>
            )}
            {lead.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Budget: ₹{lead.budget.toLocaleString()}</span>
              </div>
            )}
            {lead.assigned_emp_name && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Assigned: {lead.assigned_emp_name}</span>
              </div>
            )}
            {lead.requirement && (
              <div className="md:col-span-2 flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{lead.requirement}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground flex gap-4">
            <span>Created: {lead.c_date ? new Date(lead.c_date).toLocaleString() : ""}</span>
            <span>ID: #{lead.lead_id}</span>
          </div>
        </Card>

        {/* Communication History */}
        <Card className="p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <PhoneCall className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Communication History</h3>
            <Badge variant="secondary" className="rounded-full">{followups.length}</Badge>
          </div>

          {loadingFollowups ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : followups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-2" />
              <p>No communication history yet</p>
              <Button variant="outline" size="sm" className="mt-2 rounded-xl" onClick={() => navigate(`/followup/form?lead_id=${lead.lead_id}`)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add First Followup
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {followups.map((f) => (
                <div key={f.followup_id} className="flex gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <PhoneCall className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="rounded-md text-xs">{f.mode || "Call"}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {f.followup_date ? new Date(f.followup_date).toLocaleString() : ""}
                      </span>
                      {f.followup_by_name && (
                        <span className="text-xs text-muted-foreground">by {f.followup_by_name}</span>
                      )}
                    </div>
                    <p className="text-sm mt-1">{f.remark}</p>
                    {f.status_update && (
                      <p className="text-xs text-primary mt-0.5">Status: {f.status_update}</p>
                    )}
                    {f.next_followup_date && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        <Clock className="h-3 w-3 inline mr-1" />
                        Next: {new Date(f.next_followup_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}