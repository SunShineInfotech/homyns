import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { customerWalletService, CustomerWalletLedgerEntry } from "@/services/customer-wallet.service";
import { financeService, FinanceAccount } from "@/services/finance.service";
import { getIndiaDate } from "@/lib/india-date";
import { ArrowLeft, ArrowDownLeft, Loader2, Plus, Wallet } from "lucide-react";

const companyId = () => { try { return JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""; } catch { return ""; } };
const money = (amount: unknown) => `₹${(Number(amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value?: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const inputClass = "h-10 rounded-xl";

export default function CustomerWalletPage() {
  const { clientId = "" } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CustomerWalletLedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [customer, setCustomer] = useState<{ client_name: string; wallet: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ account_id: "", amount: "", payment_date: getIndiaDate(), payment_method: "Bank Transfer", reference_number: "", remark: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ledger, accountResult] = await Promise.all([customerWalletService.ledger(companyId(), clientId), financeService.accounts(companyId())]);
      if (ledger.status === "success") { setRows(ledger.data || []); setCustomer(ledger.customer || null); }
      else toast({ title: "Could not load customer transactions", description: ledger.message, variant: "destructive" });
      if (accountResult.status === "success") setAccounts(accountResult.data || []);
      else toast({ title: "Could not load accounts", description: accountResult.message, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Could not load customer wallet", description: error?.response?.data?.message || error?.message || "Please try again.", variant: "destructive" });
    } finally { setLoading(false); }
  }, [clientId]);
  useEffect(() => { void load(); }, [load]);

  const debitTotal = useMemo(() => rows.reduce((sum, row) => sum + Number(row.debit || 0), 0), [rows]);
  const creditTotal = useMemo(() => rows.reduce((sum, row) => sum + Number(row.credit || 0), 0), [rows]);
  const accountOptions = accounts.map(account => ({ value: String(account.account_id), label: account.account_name, sublabel: money(account.account_balance) }));

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.account_id || !Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      const result = await customerWalletService.collectPayment(companyId(), { client_id: clientId, account_id: form.account_id, amount, payment_date: form.payment_date, payment_method: form.payment_method, reference_number: form.reference_number, remark: form.remark });
      if (result.status !== "success") { toast({ title: "Could not record payment", description: result.message, variant: "destructive" }); return; }
      toast({ title: "Payment received", description: `${money(amount)} added to the account and deducted from ${customer?.client_name || "customer"}'s wallet.` });
      setOpen(false);
      setForm({ account_id: "", amount: "", payment_date: getIndiaDate(), payment_method: "Bank Transfer", reference_number: "", remark: "" });
      await load();
    } catch (error: any) {
      toast({ title: "Could not record payment", description: error?.response?.data?.message || error?.message || "Please try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return <MainLayout title="Customer Wallet Transactions" subtitle={customer?.client_name || "Customer account statement"}>
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/customers")}><ArrowLeft className="mr-2 h-4 w-4"/>Back to Customers</Button>
        <Button onClick={() => setOpen(true)} disabled={!accounts.length || !customer || Number(customer.wallet) <= 0}><Plus className="mr-2 h-4 w-4"/>Collect Payment</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Wallet className="h-5 w-5"/></div><div><p className="text-sm text-muted-foreground">Current wallet due</p><p className="text-xl font-semibold">{money(customer?.wallet)}</p></div></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Total charges</p><p className="text-xl font-semibold">{money(debitTotal)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">Payments received</p><p className="text-xl font-semibold">{money(creditTotal)}</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="bg-muted/50"><tr>{["Date", "Transaction ID", "Type", "Reference", "Remark / Account", "Debit", "Credit", "Balance"].map(label => <th key={label} className="px-4 py-3 text-left font-medium text-muted-foreground">{label}</th>)}</tr></thead>
            <tbody className="divide-y">
              {rows.map((row, index) => (
                <tr key={`${row.transaction_id}-${index}`} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{dateLabel(row.transaction_date)}</td><td className="px-4 py-3 font-mono">{row.transaction_id}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{row.transaction_type}</Badge></td><td className="px-4 py-3">{row.reference || "—"}</td>
                  <td className="px-4 py-3">{row.remark || "—"}{row.account_name && <span className="block text-xs text-muted-foreground">{row.account_name}</span>}</td>
                  <td className="px-4 py-3 text-right">{Number(row.debit) ? money(row.debit) : "—"}</td><td className="px-4 py-3 text-right">{Number(row.credit) ? money(row.credit) : "—"}</td><td className="px-4 py-3 text-right font-semibold">{money(row.balance)}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No wallet transactions found.</td></tr>}
            </tbody>
            {rows.length > 0 && <tfoot className="bg-muted/40 font-semibold"><tr><td colSpan={5} className="px-4 py-3 text-right">Totals</td><td className="px-4 py-3 text-right">{money(debitTotal)}</td><td className="px-4 py-3 text-right">{money(creditTotal)}</td><td className="px-4 py-3 text-right">{money(rows[rows.length - 1]?.balance)}</td></tr></tfoot>}
          </table>
        </div>
        {loading && <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div>}
      </Card>
    </div>
    <Dialog open={open} onOpenChange={value => !saving && setOpen(value)}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Collect Customer Payment</DialogTitle><DialogDescription>Record money received from {customer?.client_name || "this customer"}. The amount is added to the selected account and deducted from the customer wallet.</DialogDescription></DialogHeader>
      <form onSubmit={submitPayment} className="space-y-4"><div className="space-y-1.5"><Label>Deposit To Account *</Label><SearchableSelect options={accountOptions} value={form.account_id} onChange={account_id => setForm(current => ({ ...current, account_id }))} placeholder="Select account" searchPlaceholder="Search accounts…"/></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Payment Date *</Label><Input required type="date" className={inputClass} value={form.payment_date} onChange={event => setForm(current => ({ ...current, payment_date: event.target.value }))}/></div><div className="space-y-1.5"><Label>Amount (₹) *</Label><Input required type="number" min="0.01" max={customer?.wallet || undefined} step="0.01" className={inputClass} value={form.amount} onChange={event => setForm(current => ({ ...current, amount: event.target.value }))}/><p className="text-xs text-muted-foreground">Wallet due: {money(customer?.wallet)}</p></div><div className="space-y-1.5"><Label>Payment Method</Label><select className={`${inputClass} w-full rounded-xl border bg-background px-3 text-sm`} value={form.payment_method} onChange={event => setForm(current => ({ ...current, payment_method: event.target.value }))}><option>Bank Transfer</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>Card</option><option>Other</option></select></div><div className="space-y-1.5"><Label>Reference Number</Label><Input className={inputClass} value={form.reference_number} onChange={event => setForm(current => ({ ...current, reference_number: event.target.value }))} placeholder="Transaction / cheque number"/></div></div>
        <div className="space-y-1.5"><Label>Remark</Label><Textarea rows={3} value={form.remark} onChange={event => setForm(current => ({ ...current, remark: event.target.value }))} placeholder="Optional payment note"/></div>
        <div className="rounded-xl bg-muted/50 p-3 text-sm"><div className="flex items-center gap-2 font-medium"><ArrowDownLeft className="h-4 w-4 text-emerald-600"/>Payment effect</div><p className="mt-1 text-muted-foreground">Account balance increases and customer wallet due decreases by {money(form.amount)}.</p></div>
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving || !accounts.length || !form.account_id}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{saving ? "Saving…" : "Save Payment"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
  </MainLayout>;
}
