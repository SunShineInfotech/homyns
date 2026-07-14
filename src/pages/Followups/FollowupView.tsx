// src/pages/Followups/FollowupView.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { followupService, Followup } from "@/services/followup.service";
import { leadService, Lead } from "@/services/lead.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import { employeeService, Employee } from "@/services/employee.service";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  PhoneCall,
  User,
  Users,
  Send,
  Plus,
} from "lucide-react";

export default function FollowupView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const leadIdFromQuery = searchParams.get('lead_id');
  const navigate = useNavigate();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // New followup form
  const [newFollowup, setNewFollowup] = useState({
    followup_date: new Date().toISOString().split('T')[0],
    next_followup_date: "",
    mode: "Call",
    remark: "",
    status_update: "no-change",
  });
  
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const companyId = getCompanyId();
        if (!companyId) {
          toast({ title: "Error", description: "Company not found", variant: "destructive" });
          return;
        }

        // Fetch statuses and employees
        const [statusesRes, employeesRes] = await Promise.all([
          leadStatusService.getLeadStatuses(companyId),
          employeeService.getEmployees(companyId),
        ]);
        
        if (statusesRes.status === "success") setStatuses(statusesRes.data || []);
        if (employeesRes.status === "success") setEmployees(employeesRes.data || []);

        // Get lead ID - use leadIdFromQuery first, then fallback to id if it's a lead ID
        const leadId = leadIdFromQuery || id;
        
        if (!leadId) {
          toast({ title: "Error", description: "Lead ID is required", variant: "destructive" });
          setLoading(false);
          return;
        }

        console.log('Fetching lead with ID:', leadId);

        // Fetch lead details
        const leadRes = await leadService.getLead(leadId);
        console.log('Lead response:', leadRes);
        
        if (leadRes.status === "success" && leadRes.data) {
          setLead(leadRes.data);
        } else {
          toast({ title: "Error", description: leadRes.message || "Failed to fetch lead", variant: "destructive" });
          setLoading(false);
          return;
        }

        // Fetch lead followups
        const followupRes = await followupService.getLeadFollowups(leadId);
        console.log('Followups response:', followupRes);
        
        if (followupRes.status === "success" && followupRes.data) {
          setFollowups(followupRes.data);
        }
      } catch (e: any) {
        console.error('Fetch error:', e);
        toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, leadIdFromQuery]);

  const handleAddFollowup = async () => {
    if (!newFollowup.remark.trim()) {
      toast({ title: "Error", description: "Remark is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company_id: getCompanyId(),
        lead_id: lead?.lead_id,
        followup_date: newFollowup.followup_date,
        next_followup_date: newFollowup.next_followup_date || "",
        followup_by: getEmployeeId(),
        mode: newFollowup.mode,
        remark: newFollowup.remark.trim(),
        status_update: newFollowup.status_update === "no-change" ? "" : newFollowup.status_update,
      };

      const res = await followupService.addFollowup(payload);
      if (res.status === "success") {
        toast({ title: "Success", description: "Followup added successfully" });
        
        // Refresh followups
        if (lead?.lead_id) {
          const followupRes = await followupService.getLeadFollowups(lead.lead_id);
          if (followupRes.status === "success" && followupRes.data) {
            setFollowups(followupRes.data);
          }
        }
        
        // Reset form
        setNewFollowup({
          followup_date: new Date().toISOString().split('T')[0],
          next_followup_date: "",
          mode: "Call",
          remark: "",
          status_update: "no-change",
        });
      } else {
        toast({ title: "Error", description: res.message || "Failed to add followup", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getModeColor = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'call': return 'bg-blue-100 text-blue-800';
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      <MainLayout title="Followup Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!lead) {
    return (
      <MainLayout title="Followup Details" subtitle="Lead not found">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="outline" className="rounded-xl" onClick={() => navigate("/all-followups")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Followups
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={lead.lead_name || "Followup Details"} subtitle="Communication history">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate("/all-followups")}>
          <ArrowLeft className="h-4 w-4" /> Back to Followups
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side - Lead Info & History */}
          <div className="lg:col-span-2 space-y-4">
            {/* Lead Info Card */}
            <Card className="p-5 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{lead.lead_name}</h3>
                  {lead.status && (
                    <Badge className={`mt-1 ${getStatusColor(lead.status_name || lead.status)}`}>
                      {lead.status_name || lead.status}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/lead/view/${lead.lead_id}`)}>
                  View Lead
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {lead.phone1 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone1}</span>
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
                    <span className="truncate">{lead.address}</span>
                  </div>
                )}
                {lead.assigned_emp_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Assigned: {lead.assigned_emp_name}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Communication History */}
            <Card className="p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Communication History</h4>
                <Badge variant="secondary" className="rounded-full">{followups.length}</Badge>
              </div>

              {followups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-2" />
                  <p>No communication yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {followups.map((f) => (
                    <div key={f.followup_id} className="flex gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <PhoneCall className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`rounded-md text-xs px-2 py-0.5 ${getModeColor(f.mode)}`}>
                            {f.mode || "Call"}
                          </Badge>
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

          {/* Right side - Add New Followup Form */}
          <div className="lg:col-span-1">
            <Card className="p-5 rounded-2xl sticky top-4">
              <h4 className="font-semibold flex items-center gap-2 mb-4">
                <Plus className="h-4 w-4 text-primary" />
                Add New Communication
              </h4>

              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newFollowup.followup_date}
                    onChange={(e) => setNewFollowup(p => ({ ...p, followup_date: e.target.value }))}
                    className="h-10 rounded-xl mt-1"
                  />
                </div>

                <div>
                  <Label>Mode</Label>
                  <Select
                    value={newFollowup.mode}
                    onValueChange={(v) => setNewFollowup(p => ({ ...p, mode: v }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl mt-1">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Remark <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={newFollowup.remark}
                    onChange={(e) => setNewFollowup(p => ({ ...p, remark: e.target.value }))}
                    className="min-h-[80px] rounded-xl mt-1 resize-y"
                    placeholder="Enter followup details..."
                  />
                </div>

                <div>
                  <Label>Status Update</Label>
                  <Select
                    value={newFollowup.status_update}
                    onValueChange={(v) => setNewFollowup(p => ({ ...p, status_update: v }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl mt-1">
                      <SelectValue placeholder="Update status (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">No change</SelectItem>
                      {statuses.map((s) => (
                        <SelectItem key={s.status_id} value={s.status_name || ""}>
                          {s.status_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Next Followup Date</Label>
                  <Input
                    type="date"
                    value={newFollowup.next_followup_date}
                    onChange={(e) => setNewFollowup(p => ({ ...p, next_followup_date: e.target.value }))}
                    className="h-10 rounded-xl mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank if no followup needed</p>
                </div>

                <Button 
                  className="w-full rounded-xl gap-2 h-11" 
                  onClick={handleAddFollowup}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Add Followup</>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}