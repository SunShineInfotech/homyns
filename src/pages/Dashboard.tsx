import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText, FileEdit, Clock, CheckCircle2, XCircle, TrendingUp,
  ArrowRight, Plus, Calendar, Users, PhoneCall, PieChart as PieChartIcon,
  Loader2, MessageSquare, User, Phone, BarChart3, Activity,
  Target, Zap, Star, TrendingDown, DollarSign,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line,
} from "recharts";
import { toast } from "@/hooks/use-toast";
import { quotationService } from "@/services/quotation.service";
import { leadService } from "@/services/lead.service";
import { leadSourceService, LeadSource } from "@/services/lead-source.service";
import { leadStatusService, LeadStatus } from "@/services/lead-status.service";
import { customerService } from "@/services/customer.service";
import { followupService, Followup } from "@/services/followup.service";

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#fb7185", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#3b82f6", "#6366f1",
];

const STATUS_COLORS: Record<string, string> = {
  'Pending': '#f59e0b',
  'Approved by Admin': '#3b82f6',
  'Sent to Customer': '#8b5cf6',
  'Approved by Customer': '#22c55e',
  'Invoice Generated': '#8b5cf6',
  'Work Started': '#06b6d4',
  'On Going': '#f97316',
  'Work Completed': '#10b981',
  'Closed': '#6b7280',
  'Rejected': '#ef4444',
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  'New': '#3b82f6',
  'Contacted': '#f59e0b',
  'Qualified': '#8b5cf6',
  'Proposal Sent': '#ec4899',
  'Negotiation': '#f97316',
  'Won': '#22c55e',
  'Lost': '#ef4444',
  'Follow-up': '#06b6d4',
  'Not Interested': '#6b7280',
  'Junk': '#d1d5db',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));

  // Dashboard data
  const [quotations, setQuotations] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [todayFollowups, setTodayFollowups] = useState<Followup[]>([]);
  const [pendingFollowups, setPendingFollowups] = useState<Followup[]>([]);

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

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const companyId = getCompanyId();
        const empId = getEmployeeId();
        if (!companyId) {
          toast({ title: "Error", description: "Company not found", variant: "destructive" });
          return;
        }

        const [
          quotationsRes,
          leadsRes,
          sourcesRes,
          statusesRes,
          clientsRes,
          followupsRes,
        ] = await Promise.all([
          quotationService.getQuotations(companyId),
          leadService.getLeads(companyId, 'all'),
          leadSourceService.getLeadSources(companyId),
          leadStatusService.getLeadStatuses(companyId),
          customerService.getCustomers(companyId),
          followupService.getFollowups(companyId, 'my_today', empId),
        ]);

        if (quotationsRes.status === "success" && quotationsRes.data) {
          setQuotations(quotationsRes.data);
        }
        if (leadsRes.status === "success" && leadsRes.data) {
          setLeads(leadsRes.data);
        }
        if (sourcesRes.status === "success" && sourcesRes.data) {
          setLeadSources(sourcesRes.data);
        }
        if (statusesRes.status === "success" && statusesRes.data) {
          setLeadStatuses(statusesRes.data);
        }
        if (clientsRes.status === "success" && clientsRes.data) {
          setClients(clientsRes.data);
        }
        if (followupsRes.status === "success" && followupsRes.data) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayList = followupsRes.data.filter((f: any) => {
            if (!f.next_followup_date) return false;
            const nextDate = new Date(f.next_followup_date);
            nextDate.setHours(0, 0, 0, 0);
            return nextDate.getTime() === today.getTime();
          });
          setTodayFollowups(todayList);

          const pendingList = followupsRes.data.filter((f: any) => {
            if (!f.next_followup_date) return false;
            const nextDate = new Date(f.next_followup_date);
            nextDate.setHours(0, 0, 0, 0);
            return nextDate < today;
          });
          setPendingFollowups(pendingList);
        }
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load dashboard", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter data by date range
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const date = q.c_date?.split(' ')[0] || '';
      return date >= start && date <= end;
    });
  }, [quotations, start, end]);

  // Filter leads by date range
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const date = l.c_date?.split(' ')[0] || '';
      return date >= start && date <= end;
    });
  }, [leads, start, end]);

  // Quotation Status Counts with breakdown
  const quotationStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredQuotations.forEach((q) => {
      const status = q.status || 'Pending';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [filteredQuotations]);

  // Lead Status Counts with breakdown
  const leadStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const statusId = l.status || '';
      const statusName = leadStatuses.find(s => s.status_id === statusId)?.status_name || statusId || 'Unknown';
      counts[statusName] = (counts[statusName] || 0) + 1;
    });
    return counts;
  }, [filteredLeads, leadStatuses]);

  // Lead Source Counts
  const leadSourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach((l) => {
      const sourceId = l.source_id || '';
      const sourceName = leadSources.find(s => s.source_id === sourceId)?.source_name || sourceId || 'Unknown';
      counts[sourceName] = (counts[sourceName] || 0) + 1;
    });
    return counts;
  }, [filteredLeads, leadSources]);

  // Find best source
  const bestSource = useMemo(() => {
    let maxCount = 0;
    let best = '';
    Object.entries(leadSourceCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        best = name;
      }
    });
    return { name: best, count: maxCount };
  }, [leadSourceCounts]);

  // Quotation Trend Data
  const quotationTrendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredQuotations.forEach((q) => {
      const date = q.c_date?.split(' ')[0] || '';
      map.set(date, (map.get(date) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [filteredQuotations]);

  // Lead Trend Data
  const leadTrendData = useMemo(() => {
    const map = new Map<string, number>();
    filteredLeads.forEach((l) => {
      const date = l.c_date?.split(' ')[0] || '';
      map.set(date, (map.get(date) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [filteredLeads]);

  // Calculate totals
  const totalQuotations = filteredQuotations.length;
  const totalLeads = filteredLeads.length;
  const totalClients = clients.length;
  const totalSources = leadSources.length;

  // Quotation status breakdown for display
  const quotationStatusItems = Object.entries(quotationStatusCounts)
    .sort(([, a], [, b]) => b - a);

  // Lead status breakdown for display
  const leadStatusItems = Object.entries(leadStatusCounts)
    .sort(([, a], [, b]) => b - a);

  // Get status color for display
  const getQuotationStatusColor = (status: string) => {
    return STATUS_COLORS[status] || '#6b7280';
  };

  const getLeadStatusColor = (status: string) => {
    return LEAD_STATUS_COLORS[status] || '#6b7280';
  };

  // KPIs with status breakdown
  const kpis = [
    { 
      label: "Total Quotations", 
      value: totalQuotations, 
      icon: FileText, 
      color: "primary",
      breakdown: quotationStatusItems,
      breakdownLabel: "Status"
    },
    { 
      label: "Total Leads", 
      value: totalLeads, 
      icon: Users, 
      color: "primary",
      breakdown: leadStatusItems,
      breakdownLabel: "Status"
    },
    { 
      label: "Total Clients", 
      value: totalClients, 
      icon: User, 
      color: "success",
      breakdown: [],
      breakdownLabel: ""
    },
    { 
      label: "Lead Sources", 
      value: totalSources, 
      icon: PieChartIcon, 
      color: "warning",
      breakdown: Object.entries(leadSourceCounts).sort(([, a], [, b]) => b - a),
      breakdownLabel: "Source"
    },
  ];

  const kpiAccent = (c: string) => ({
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  } as Record<string, string>)[c];

  // Prepare chart data
  const quotationPieData = Object.entries(quotationStatusCounts).map(([name, value]) => ({ name, value }));
  const leadStatusPieData = Object.entries(leadStatusCounts).map(([name, value]) => ({ name, value }));
  const leadSourcePieData = Object.entries(leadSourceCounts).map(([name, value]) => ({ name, value }));

  // Sort lead source data for bar chart
  const sortedLeadSourceData = [...leadSourcePieData].sort((a, b) => b.value - a.value);

  // Recent leads
  const recentLeads = [...filteredLeads]
    .sort((a, b) => (b.c_date || '').localeCompare(a.c_date || ''))
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount || 0).toLocaleString()}`;
  };

  const getSourceStatusColor = (name: string) => {
    if (name === bestSource.name) return 'text-success border-success bg-success/10';
    if (bestSource.count > 0 && leadSourceCounts[name] / bestSource.count < 0.3) return 'text-muted-foreground border-muted-foreground/30 bg-muted/30';
    return 'text-foreground border-border bg-secondary/30';
  };

  if (loading) {
    return (
      <MainLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle="Overview of your business">
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Hero CTA */}
        <Card className="border-0 p-5 md:p-7 shadow-elevated overflow-hidden relative bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground rounded-2xl">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-semibold mb-1">Create New Quotation</h2>
              <p className="text-primary-foreground/85 text-sm md:text-base">Start crafting a professional quotation in minutes</p>
            </div>
            <Button onClick={() => navigate("/create-quotation/client")} size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl gap-2 shadow-lg">
              <Plus className="w-5 h-5" /> New Quotation
            </Button>
          </div>
        </Card>

        {/* Date Filter */}
        <Card className="p-4 md:p-5 rounded-2xl border-border">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 pl-10 rounded-xl" />
              </div>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1.5 block">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 pl-10 rounded-xl" />
              </div>
            </div>
            <Button variant="outline" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 30); setStart(d.toISOString().slice(0, 10)); setEnd(new Date().toISOString().slice(0, 10)); }} className="h-11 rounded-xl">Reset</Button>
          </div>
        </Card>

        {/* KPI Grid with Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4 rounded-2xl border-border hover:shadow-soft transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpiAccent(k.color)}`}>
                  <k.icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-display font-bold text-foreground">{k.value}</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
              
              {/* Status Breakdown */}
              {k.breakdown && k.breakdown.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {k.breakdown.slice(0, 5).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ 
                            backgroundColor: k.label === "Total Quotations" 
                              ? getQuotationStatusColor(name) 
                              : k.label === "Total Leads" 
                                ? getLeadStatusColor(name) 
                                : COLORS[Math.floor(Math.random() * COLORS.length)]
                          }} 
                        />
                        <span className="text-muted-foreground truncate max-w-[100px]">{name}</span>
                      </div>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                  {k.breakdown.length > 5 && (
                    <div className="text-[10px] text-muted-foreground text-center pt-1">
                      +{k.breakdown.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Best Source Highlight */}
        {bestSource.name && bestSource.count > 0 && (
          <Card className="p-4 md:p-5 rounded-2xl border-2 border-success/30 bg-success/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Best Performing Source</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">{bestSource.name}</span>
                  <Badge className="bg-success text-success-foreground">{bestSource.count} leads</Badge>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-success opacity-60" />
            </div>
          </Card>
        )}

        {/* Charts Row 1 - Quotation Status & Lead Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="p-5 rounded-2xl border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Quotation Status</h3>
              <span className="text-xs text-muted-foreground">{totalQuotations} total</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={quotationPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {quotationPieData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Lead Status Distribution</h3>
              <span className="text-xs text-muted-foreground">{totalLeads} total</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadStatusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {leadStatusPieData.map((entry, i) => (
                      <Cell key={i} fill={LEAD_STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Charts Row 2 - Lead Sources & Lead Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="p-5 rounded-2xl border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Lead Sources</h3>
              <span className="text-xs text-muted-foreground">{totalSources} sources</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedLeadSourceData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(leadSourceCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, count]) => (
                  <Badge key={name} className={`rounded-full px-3 py-1 text-xs border ${getSourceStatusColor(name)}`}>
                    {name}: {count}
                    {name === bestSource.name && <Star className="w-3 h-3 ml-1 inline" />}
                  </Badge>
                ))}
            </div>
          </Card>

          <Card className="p-5 rounded-2xl border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Lead Trend</h3>
              <span className="text-xs text-muted-foreground">Daily leads</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={leadTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Quotation Trend */}
        <Card className="p-5 rounded-2xl border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Quotation Trend</h3>
            <span className="text-xs text-muted-foreground">{totalQuotations} total</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quotationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Today's Followups & Pending Followups */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Today's Followups */}
          <Card className="rounded-2xl border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-primary/5">
              <div>
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Today's Followups
                </h3>
                <p className="text-xs text-muted-foreground">Followups scheduled for today</p>
              </div>
              <Badge className="bg-primary text-primary-foreground">{todayFollowups.length}</Badge>
            </div>
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {todayFollowups.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-success/50 mb-2" />
                  No followups scheduled for today
                </div>
              ) : (
                todayFollowups.map((f) => (
                  <div key={f.followup_id} className="p-4 hover:bg-secondary/30 cursor-pointer" onClick={() => navigate(`/lead/view/${f.lead_id}`)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{f.lead_name || 'Lead'}</p>
                        {f.lead_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {f.lead_phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{f.remark}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                        {f.mode || 'Call'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Pending Followups */}
          <Card className="rounded-2xl border-border overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-destructive/5">
              <div>
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-destructive" />
                  Pending Followups
                </h3>
                <p className="text-xs text-muted-foreground">Overdue followups</p>
              </div>
              <Badge className="bg-destructive text-destructive-foreground">{pendingFollowups.length}</Badge>
            </div>
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
              {pendingFollowups.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-success/50 mb-2" />
                  No pending followups
                </div>
              ) : (
                pendingFollowups.map((f) => (
                  <div key={f.followup_id} className="p-4 hover:bg-secondary/30 cursor-pointer" onClick={() => navigate(`/lead/view/${f.lead_id}`)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{f.lead_name || 'Lead'}</p>
                        {f.lead_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {f.lead_phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{f.remark}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <Badge variant="outline" className="text-xs">
                          {f.mode || 'Call'}
                        </Badge>
                        {f.next_followup_date && (
                          <span className="text-[10px] text-destructive">
                            Due: {new Date(f.next_followup_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="rounded-2xl border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-display font-semibold">Recent Leads</h3>
              <p className="text-xs text-muted-foreground">Latest leads added to the system</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/all-leads")} className="text-primary gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3 hidden md:table-cell">Source</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentLeads.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">No leads found</td></tr>
                )}
                {recentLeads.map((lead) => {
                  const sourceName = leadSources.find(s => s.source_id === lead.source_id)?.source_name || lead.source_id || '—';
                  const statusName = leadStatuses.find(s => s.status_id === lead.status)?.status_name || lead.status || '—';
                  return (
                    <tr key={lead.lead_id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => navigate(`/lead/view/${lead.lead_id}`)}>
                      <td className="px-5 py-3.5 font-medium">{lead.lead_name}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{lead.phone1 || '—'}</td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{sourceName}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {statusName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                        {lead.c_date ? new Date(lead.c_date).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          Data updated in real-time · {new Date().toLocaleString()}
        </div>
      </div>
    </MainLayout>
  );
}