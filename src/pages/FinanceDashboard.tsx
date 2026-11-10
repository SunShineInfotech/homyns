import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowDownRight, ArrowUpRight, Building2, CalendarDays, CircleDollarSign, Loader2, RefreshCw, Store, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financeService, FinanceDashboardData } from "@/services/finance.service";
import { getIndiaDate } from "@/lib/india-date";
import { toast } from "@/hooks/use-toast";

const PALETTE = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#0891b2", "#16a34a", "#ca8a04", "#4f46e5"];
const empty: FinanceDashboardData = {
  counts: { customers: 0, vendors: 0, agencies: 0, other_income: 0, other_expense: 0 },
  totals: { customer_outstanding: 0, vendor_outstanding: 0, agency_pending: 0, other_income: 0, other_expense: 0 },
  customers: [], vendors: [], agencies: [], monthly: [], expense_categories: [],
};
const companyId = () => { try { return String(JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""); } catch { return ""; } };
const money = (amount: number) => `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Metric({ title, count, amount, icon: Icon, tone, delay }: { title: string; count: number; amount: number; icon: typeof Users; tone: string; delay: number }) {
  return <Card className="animate-fade-in overflow-hidden rounded-2xl border-border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-5" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{count.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-muted-foreground">records</p></div><span className={`rounded-xl p-3 ${tone}`}><Icon className="h-5 w-5" /></span></div>
    <div className="mt-4 flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">All-time outstanding</span><span className="font-semibold tabular-nums">{money(amount)}</span></div>
  </Card>;
}

function OutstandingList({ title, subtitle, rows, icon: Icon, color, onSelect, delay }: { title: string; subtitle: string; rows: FinanceDashboardData["customers"]; icon: typeof Users; color: string; onSelect: (id: string) => void; delay: number }) {
  return <Card className="animate-fade-in overflow-hidden rounded-2xl border-border shadow-sm transition-all duration-300 hover:shadow-lg" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center gap-3 border-b p-4"><span className={`rounded-xl p-2.5 ${color}`}><Icon className="h-5 w-5" /></span><div><h2 className="font-semibold">{title}</h2><p className="text-xs text-muted-foreground">{subtitle}</p></div></div>
    <div className="divide-y">{rows.length ? rows.map((row, index) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
      <span className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{index + 1}</span><span className="truncate text-sm font-medium">{row.name}</span></span><span className="shrink-0 text-sm font-semibold tabular-nums">{money(row.amount)}</span>
    </button>) : <div className="p-8 text-center text-sm text-muted-foreground">No outstanding balances</div>}</div>
    <div className="border-t bg-muted/20 px-4 py-2 text-right text-[11px] text-muted-foreground">Top 10 · all-time balance, not affected by date filter</div>
  </Card>;
}

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(() => getIndiaDate(-30));
  const [to, setTo] = useState(() => getIndiaDate());
  const [data, setData] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (start = from, end = to) => {
    if (!start || !end || start > end) { setError("Start date must be on or before the end date."); return; }
    setError(""); setLoading(true);
    try {
      const response = await financeService.dashboard(companyId(), start, end);
      if (response.status === "success" && response.data) setData(response.data);
      else { setError(response.message || "Could not load finance dashboard."); toast({ title: "Finance dashboard unavailable", description: response.message, variant: "destructive" }); }
    } catch (e: any) { setError(e?.message || "Could not load finance dashboard."); toast({ title: "Finance dashboard unavailable", description: e?.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const trend = useMemo(() => data.monthly.map(item => ({ ...item, label: new Date(`${item.month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) })), [data.monthly]);
  const categoryTotal = data.expense_categories.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const statusCards = [
    { title: "Customers", count: data.counts.customers, amount: data.totals.customer_outstanding, icon: Users, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { title: "Vendors", count: data.counts.vendors, amount: data.totals.vendor_outstanding, icon: Store, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { title: "Agencies", count: data.counts.agencies, amount: data.totals.agency_pending, icon: Building2, tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  ];

  return <MainLayout title="Finance Dashboard" subtitle="All-time outstanding balances and date-filtered income and expense reports">
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 pb-12 md:p-6">
      <Card className="animate-fade-in rounded-2xl border-border bg-gradient-to-r from-primary/[0.08] via-card to-cyan-500/[0.07] p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-1 flex items-center gap-2"><Activity className="h-5 w-5 text-primary"/><h2 className="font-display text-lg font-semibold">Finance overview</h2></div><p className="max-w-2xl text-sm text-muted-foreground">Date range applies only to Other Income and Other Expense counts, totals, and charts. Customer, vendor, and agency balances below always show current all-time outstanding.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end"><div className="space-y-1.5"><Label htmlFor="finance-from" className="text-xs text-muted-foreground">Start date</Label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input id="finance-from" type="date" value={from} max={to} onChange={e=>setFrom(e.target.value)} className="h-10 min-w-0 pl-9 sm:w-40"/></div></div><div className="space-y-1.5"><Label htmlFor="finance-to" className="text-xs text-muted-foreground">End date</Label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input id="finance-to" type="date" value={to} min={from} max={getIndiaDate()} onChange={e=>setTo(e.target.value)} className="h-10 min-w-0 pl-9 sm:w-40"/></div></div><Button onClick={()=>void load()} disabled={loading} className="col-span-2 h-10 gap-2 sm:col-span-1">{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>}Apply dates</Button></div>
        </div>{error&&<p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </Card>

      <section className="space-y-3"><div><h2 className="font-display text-lg font-semibold">People and outstanding balances</h2><p className="text-sm text-muted-foreground">Current total counts and outstanding exposure across the company.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{statusCards.map((item,index)=><Metric key={item.title} {...item} delay={index*70}/>)}</div></section>

      <section className="space-y-3"><div><h2 className="font-display text-lg font-semibold">Income and expenses · selected period</h2><p className="text-sm text-muted-foreground">{from} to {to} · other income and other expense entries only</p></div><div className="grid gap-4 sm:grid-cols-2">{[
        { title: "Other Income", count: data.counts.other_income, amount: data.totals.other_income, icon: ArrowUpRight, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
        { title: "Other Expenses", count: data.counts.other_expense, amount: data.totals.other_expense, icon: ArrowDownRight, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
      ].map((item,index)=><Card key={item.title} className="animate-fade-in rounded-2xl border-border p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-5" style={{animationDelay:`${index*80}ms`}}><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{item.title}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{money(item.amount)}</p><p className="mt-1 text-xs text-muted-foreground">{item.count.toLocaleString("en-IN")} entries in selected dates</p></div><span className={`rounded-xl p-3 ${item.tone}`}><item.icon className="h-5 w-5"/></span></div></Card>)}</div></section>

      <section className="grid gap-4 xl:grid-cols-5"><Card className="animate-fade-in rounded-2xl border-border p-4 shadow-sm transition-all duration-300 hover:shadow-lg md:p-5 xl:col-span-3"><div className="mb-4"><h2 className="font-semibold">Monthly income and expense</h2><p className="text-xs text-muted-foreground">Grouped by month within the selected date range</p></div><div className="h-72 min-w-0">{loading?<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>:<ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:8,right:8,left:0,bottom:0}}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={.32}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={.28}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12}/><YAxis tickLine={false} axisLine={false} width={64} fontSize={11} tickFormatter={v=>`₹${Number(v)>=100000?`${(Number(v)/100000).toFixed(0)}L`:Number(v)>=1000?`${(Number(v)/1000).toFixed(0)}k`:v}`}/><Tooltip formatter={(v:number)=>money(v)} contentStyle={{borderRadius:12,border:"1px solid hsl(var(--border))"}}/><Area type="monotone" dataKey="income" name="Other income" stroke="#059669" fill="url(#incomeFill)" strokeWidth={2.5}/><Area type="monotone" dataKey="expense" name="Other expense" stroke="#e11d48" fill="url(#expenseFill)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer>}</div></Card>
        <Card className="animate-fade-in rounded-2xl border-border p-4 shadow-sm transition-all duration-300 hover:shadow-lg md:p-5 xl:col-span-2" style={{animationDelay:"100ms"}}><div className="mb-4"><h2 className="font-semibold">Expenses by category</h2><p className="text-xs text-muted-foreground">{money(categoryTotal)} across {data.expense_categories.length} categories</p></div><div className="h-72 min-w-0">{loading?<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>:data.expense_categories.length?<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.expense_categories} dataKey="amount" nameKey="name" cx="50%" cy="45%" innerRadius={54} outerRadius={88} paddingAngle={3}>{data.expense_categories.map((row,index)=><Cell key={`${row.name}-${index}`} fill={PALETTE[index%PALETTE.length]}/>)}</Pie><Tooltip formatter={(v:number)=>money(v)} contentStyle={{borderRadius:12,border:"1px solid hsl(var(--border))"}}/><Legend verticalAlign="bottom" height={48} wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer>:<div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground"><CircleDollarSign className="mb-2 h-8 w-8 opacity-40"/>No expenses in this date range</div>}</div></Card></section>

      <section className="grid gap-4 xl:grid-cols-3"><OutstandingList title="Customer outstanding" subtitle="Customers with the highest wallet balance" rows={data.customers} icon={Users} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" delay={0} onSelect={id=>navigate(`/customers/${id}/transactions`)}/><OutstandingList title="Vendor outstanding" subtitle="Vendors with the highest amount payable" rows={data.vendors} icon={Store} color="bg-violet-500/10 text-violet-600 dark:text-violet-400" delay={80} onSelect={id=>navigate(`/vendors/${id}/transactions`)}/><OutstandingList title="Agency pending" subtitle="Agencies with the highest pending amount" rows={data.agencies} icon={Building2} color="bg-amber-500/10 text-amber-700 dark:text-amber-400" delay={160} onSelect={id=>navigate(`/agencies/${id}/transactions`)}/></section>
      <p className="text-center text-xs text-muted-foreground">Outstanding lists and their totals are all-time balances. The selected dates affect only Other Income and Other Expense reporting.</p>
    </div>
  </MainLayout>;
}
