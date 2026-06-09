import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText, FileEdit, Clock, CheckCircle2, XCircle, TrendingUp,
  ArrowRight, Plus, Calendar,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { quotations, fmtINR, statusColor } from "@/data/mockData";

const minusDays = (d: number) => {
  const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10);
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [start, setStart] = useState(minusDays(30));
  const [end, setEnd] = useState(minusDays(0));

  const filtered = useMemo(
    () => quotations.filter((q) => q.date >= start && q.date <= end),
    [start, end]
  );

  const counts = useMemo(() => {
    const c = { Draft: 0, Pending: 0, Approved: 0, Rejected: 0, Converted: 0 } as Record<string, number>;
    filtered.forEach((q) => (c[q.status] = (c[q.status] ?? 0) + 1));
    return c;
  }, [filtered]);

  const kpis = [
    { label: "Total Quotations", value: filtered.length, icon: FileText, color: "primary" },
    { label: "Draft", value: counts.Draft, icon: FileEdit, color: "muted" },
    { label: "Pending", value: counts.Pending, icon: Clock, color: "warning" },
    { label: "Approved", value: counts.Approved, icon: CheckCircle2, color: "success" },
    { label: "Rejected", value: counts.Rejected, icon: XCircle, color: "destructive" },
    { label: "Converted", value: counts.Converted, icon: TrendingUp, color: "primary" },
  ];

  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["hsl(var(--muted-foreground))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--primary))"];

  const trendData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((q) => map.set(q.date, (map.get(q.date) ?? 0) + 1));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [filtered]);

  const drafts = filtered.filter((q) => q.status === "Draft");
  const recent = [...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const kpiAccent = (c: string) => ({
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  } as Record<string, string>)[c];

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back, Arjun">
      <div className="space-y-6 animate-fade-in">
        {/* Hero CTA */}
        <Card className="border-0 p-5 md:p-7 shadow-elevated overflow-hidden relative gradient-primary text-primary-foreground rounded-2xl">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-semibold mb-1">Create New Quotation</h2>
              <p className="text-primary-foreground/85 text-sm md:text-base">Start crafting a professional quotation in minutes</p>
            </div>
            <Button onClick={() => navigate("/create-quotation")} size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl gap-2 shadow-lg">
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
            <Button variant="outline" onClick={() => { setStart(minusDays(30)); setEnd(minusDays(0)); }} className="h-11 rounded-xl">Reset</Button>
          </div>
        </Card>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4 rounded-2xl border-border hover:shadow-soft transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpiAccent(k.color)}`}>
                <k.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-display font-semibold text-foreground leading-tight">{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="p-5 rounded-2xl border-border">
            <h3 className="font-display font-semibold mb-4">Quotation Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 rounded-2xl border-border">
            <h3 className="font-display font-semibold mb-4">Quotation Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Drafts */}
        <Card className="rounded-2xl border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="font-display font-semibold">Draft Quotations</h3>
              <p className="text-xs text-muted-foreground">Started but not completed</p>
            </div>
            <Button variant="ghost" onClick={() => navigate("/quotations")} className="text-primary gap-1">View All <ArrowRight className="w-4 h-4" /></Button>
          </div>
          <div className="divide-y divide-border">
            {drafts.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No draft quotations</p>}
            {drafts.map((q) => (
              <div key={q.id} className="p-4 md:p-5 hover:bg-secondary/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{q.id}</p>
                  <p className="text-sm text-muted-foreground truncate">{q.customerName} · {q.packageName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">{fmtINR(q.amount)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColor(q.status)}`}>{q.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent */}
        <Card className="rounded-2xl border-border overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-display font-semibold">Recent Quotations</h3>
            <Button variant="ghost" onClick={() => navigate("/quotations")} className="text-primary gap-1">View All <ArrowRight className="w-4 h-4" /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 hidden md:table-cell">Package</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((q) => (
                  <tr key={q.id} className="hover:bg-secondary/40 cursor-pointer" onClick={() => navigate(`/quotation/view/${q.id}`)}>
                    <td className="px-5 py-3.5 font-medium">{q.id}</td>
                    <td className="px-5 py-3.5">{q.customerName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{q.packageName}</td>
                    <td className="px-5 py-3.5 font-medium">{fmtINR(q.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(q.status)}`}>{q.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{q.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
