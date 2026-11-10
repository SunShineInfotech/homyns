import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Building2, Loader2, MessageCircle, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { useConfirm } from "@/lib/confirm";
import { agencyService, Agency } from "@/services/agency.service";
import { stateService, State } from "@/services/state.service";
import { cityService, City } from "@/services/city.service";
import { areaService, Area } from "@/services/area.service";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MultiSelectChips } from "@/components/ui/multi-select-chips";
import { workTypeService, WorkType } from "@/services/work-type.service";

const companyId = () => { try { return JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""; } catch { return ""; } };
const fail = (title: string, description?: string) => toast({ title, description: description || "Please try again.", variant: "destructive" });
const inputClass = "h-10 rounded-xl";
const sendWhatsApp = (phone?: string) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) { fail("WhatsApp number is unavailable"); return; }
  window.open(`https://web.whatsapp.com/send?phone=${digits.length === 10 ? `91${digits}` : digits}`, "_blank", "noopener,noreferrer");
};

function LegacyAgenciesPage() {
  const navigate = useNavigate(); const confirm = useConfirm();
  const [rows, setRows] = useState<Agency[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const [statusBusy, setStatusBusy] = useState("");
  const load = useCallback(async () => { setLoading(true); try { const result = await agencyService.list(companyId()); if (result.status === "success") setRows(result.data || []); else fail("Could not load agencies", result.message); } catch (e: any) { fail("Could not load agencies", e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const shown = useMemo(() => rows.filter(row => `${row.agency_name} ${row.firm_name || ""} ${row.contact_person || ""} ${row.email || ""} ${row.gst_number || ""} ${(row.work_type_names || []).join(" ")}`.toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const toggleStatus = async (row: Agency) => { const id = String(row.agency_id || ""); if (!id || statusBusy) return; const status = row.status === "Active" ? "Inactive" : "Active"; setStatusBusy(id); try { const result = await agencyService.save({ ...row, status }, companyId()); if (result.status === "success") setRows(current => current.map(item => String(item.agency_id) === id ? { ...item, status } : item)); else fail("Could not update agency", result.message); } catch (e: any) { fail("Could not update agency", e.message); } finally { setStatusBusy(""); } };
  const remove = async (row: Agency) => { const accepted = await confirm({ title: "Delete Agency", message: `Delete ${row.agency_name}?`, confirmText: "Delete", destructive: true }); if (!accepted) return; try { const result = await agencyService.remove(String(row.agency_id), companyId()); if (result.status === "success") { toast({ title: "Agency deleted" }); await load(); } else fail("Could not delete agency", result.message); } catch (e: any) { fail("Could not delete agency", e.message); } };
  return <MainLayout title="Agencies" subtitle="Manage agencies and their contact details"><div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative min-w-[220px] flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Search agencies" value={search} onChange={e => setSearch(e.target.value)}/></div><Button className="gap-2" onClick={() => navigate("/agencies/new")}><Plus className="h-4 w-4"/>Add Agency</Button></div>
    {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div> : <>
      <div className="hidden overflow-hidden rounded-2xl border md:block"><table className="w-full text-sm"><thead className="bg-muted/50"><tr>{["Agency / Firm","Contact","Location","Agency Work Types","GST","Status","Actions"].map(label=><th key={label} className="px-4 py-3 text-left font-medium text-muted-foreground">{label}</th>)}</tr></thead><tbody className="divide-y">{shown.map(row=><tr key={row.agency_id} className="hover:bg-muted/30"><td className="px-4 py-3"><p className="font-medium">{row.agency_name}</p><p className="text-xs text-muted-foreground">{row.firm_name || row.email || "—"}</p></td><td className="px-4 py-3">{row.contact_person || "—"}<p className="text-xs text-muted-foreground">{row.phone || "—"} · WhatsApp {row.whatsapp_number || "—"}</p></td><td className="px-4 py-3">{[row.area_name,row.city_name,row.state_name].filter(Boolean).join(", ") || "—"}</td><td className="px-4 py-3">{row.work_type_names?.length ? row.work_type_names.join(", ") : "—"}</td><td className="px-4 py-3">{row.gst_number || "—"}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><Switch checked={(row.status || "Active") === "Active"} disabled={statusBusy === String(row.agency_id)} onCheckedChange={() => void toggleStatus(row)} aria-label={`Set ${row.agency_name} status`}/><span className="text-xs text-muted-foreground">{row.status || "Active"}</span></div></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => sendWhatsApp(row.whatsapp_number || row.phone)} aria-label="WhatsApp"><MessageCircle className="h-4 w-4 text-green-600"/></Button><Button variant="ghost" size="icon" onClick={() => navigate(`/agencies/${row.agency_id}/edit`)} aria-label="Edit agency"><Pencil className="h-4 w-4 text-blue-500"/></Button><Button variant="ghost" size="icon" onClick={() => void remove(row)} aria-label="Delete agency"><Trash2 className="h-4 w-4 text-destructive"/></Button></div></td></tr>)}{!shown.length&&<tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No agencies found.</td></tr>}</tbody></table></div>
      <div className="space-y-3 md:hidden">{shown.map(row=><Card key={row.agency_id} className="rounded-2xl p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.agency_name}</p><p className="text-sm text-muted-foreground">{row.firm_name || "Firm name not set"}</p><p className="mt-1 text-xs text-muted-foreground">{row.contact_person || ""}{row.phone ? ` · ${row.phone}` : ""}</p><p className="text-xs text-muted-foreground">{[row.area_name,row.city_name,row.state_name].filter(Boolean).join(", ") || "—"}</p></div><div className="flex items-center gap-2"><Switch checked={(row.status || "Active") === "Active"} disabled={statusBusy === String(row.agency_id)} onCheckedChange={() => void toggleStatus(row)} aria-label={`Set ${row.agency_name} status`}/></div></div><div className="mt-3 flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => sendWhatsApp(row.whatsapp_number || row.phone)} aria-label="WhatsApp"><MessageCircle className="h-4 w-4 text-green-600"/></Button><Button variant="ghost" size="icon" onClick={() => navigate(`/agencies/${row.agency_id}/edit`)} aria-label="Edit agency"><Pencil className="h-4 w-4 text-blue-500"/></Button><Button variant="ghost" size="icon" onClick={() => void remove(row)} aria-label="Delete agency"><Trash2 className="h-4 w-4 text-destructive"/></Button></div></Card>)}{!shown.length&&<Card className="p-8 text-center text-sm text-muted-foreground">No agencies found.</Card>}</div>
    </>}</div></MainLayout>;
}

export function AgenciesPage() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [rows, setRows] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusBusy, setStatusBusy] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await agencyService.list(companyId());
      if (result.status === "success") setRows(result.data || []);
      else fail("Could not load agencies", result.message);
    } catch (error: any) { fail("Could not load agencies", error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  // Phone remains visible in the table but is intentionally excluded from search.
  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(row => `${row.agency_name} ${row.firm_name || ""} ${row.contact_person || ""} ${row.email || ""} ${row.gst_number || ""} ${(row.work_type_names || []).join(" ")}`.toLowerCase().includes(query));
  }, [rows, search]);
  const toggleStatus = async (row: Agency) => {
    const id = String(row.agency_id || "");
    if (!id || statusBusy) return;
    const status = row.status === "Active" ? "Inactive" : "Active";
    setStatusBusy(id);
    try {
      const result = await agencyService.save({ ...row, status }, companyId());
      if (result.status === "success") setRows(current => current.map(item => String(item.agency_id) === id ? { ...item, status } : item));
      else fail("Could not update agency", result.message);
    } catch (error: any) { fail("Could not update agency", error.message); }
    finally { setStatusBusy(""); }
  };
  const remove = async (row: Agency) => {
    const accepted = await confirm({ title: "Delete Agency", message: `Delete ${row.agency_name}?`, confirmText: "Delete", destructive: true });
    if (!accepted) return;
    try {
      const result = await agencyService.remove(String(row.agency_id), companyId());
      if (result.status === "success") { toast({ title: "Agency deleted" }); await load(); }
      else fail("Could not delete agency", result.message);
    } catch (error: any) { fail("Could not delete agency", error.message); }
  };
  const money = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const ledger = (row: Agency) => navigate(`/agencies/${row.agency_id}/transactions`);
  return <MainLayout title="Agencies" subtitle="Manage agencies, wallet balances, and transactions">
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative min-w-[220px] flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Search agencies" value={search} onChange={event => setSearch(event.target.value)}/></div><Button className="gap-2" onClick={() => navigate("/agencies/new")}><Plus className="h-4 w-4"/>Add Agency</Button></div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div> : <>
        <div className="hidden overflow-hidden rounded-2xl border md:block"><table className="w-full text-sm"><thead className="bg-muted/50"><tr>{["Agency / Firm","Contact","Location","Agency Work Types","GST","Wallet","Status","Actions"].map(label => <th key={label} className="px-4 py-3 text-left font-medium text-muted-foreground">{label}</th>)}</tr></thead><tbody className="divide-y">{shown.map(row => <tr key={row.agency_id} className="hover:bg-muted/30"><td className="px-4 py-3"><p className="font-medium">{row.agency_name}</p><p className="text-xs text-muted-foreground">{row.firm_name || row.email || "—"}</p></td><td className="px-4 py-3">{row.contact_person || "—"}<p className="text-xs text-muted-foreground">{row.phone || "—"} · WhatsApp {row.whatsapp_number || "—"}</p></td><td className="px-4 py-3">{[row.area_name,row.city_name,row.state_name].filter(Boolean).join(", ") || "—"}</td><td className="px-4 py-3">{row.work_type_names?.length ? row.work_type_names.join(", ") : "—"}</td><td className="px-4 py-3">{row.gst_number || "—"}</td><td className="px-4 py-3"><Button variant="link" className="h-auto p-0 font-semibold" onClick={() => ledger(row)}>{money(row.wallet)}</Button><p className="text-xs text-muted-foreground">View entries</p></td><td className="px-4 py-3"><div className="flex items-center gap-2"><Switch checked={(row.status || "Active") === "Active"} disabled={statusBusy === String(row.agency_id)} onCheckedChange={() => void toggleStatus(row)} aria-label={`Set ${row.agency_name} status`}/><span className="text-xs text-muted-foreground">{row.status || "Active"}</span></div></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => sendWhatsApp(row.whatsapp_number || row.phone)} aria-label="WhatsApp"><MessageCircle className="h-4 w-4 text-green-600"/></Button><Button variant="ghost" size="icon" onClick={() => navigate(`/agencies/${row.agency_id}/edit`)} aria-label="Edit agency"><Pencil className="h-4 w-4 text-blue-500"/></Button><Button variant="ghost" size="icon" onClick={() => void remove(row)} aria-label="Delete agency"><Trash2 className="h-4 w-4 text-destructive"/></Button></div></td></tr>)}{!shown.length && <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No agencies found.</td></tr>}</tbody></table></div>
        <div className="space-y-3 md:hidden">{shown.map(row => <Card key={row.agency_id} className="rounded-2xl p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.agency_name}</p><p className="text-sm text-muted-foreground">{row.firm_name || "Firm name not set"}</p><p className="mt-1 text-xs text-muted-foreground">{row.contact_person || ""}{row.phone ? ` · ${row.phone}` : ""}</p><p className="text-xs text-muted-foreground">{[row.area_name,row.city_name,row.state_name].filter(Boolean).join(", ") || "—"}</p><p className="mt-1 text-xs text-muted-foreground">Work types: {row.work_type_names?.length ? row.work_type_names.join(", ") : "—"}</p></div><Switch checked={(row.status || "Active") === "Active"} disabled={statusBusy === String(row.agency_id)} onCheckedChange={() => void toggleStatus(row)} aria-label={`Set ${row.agency_name} status`}/></div><Button variant="link" className="mt-2 h-auto p-0 font-semibold" onClick={() => ledger(row)}>Wallet · {money(row.wallet)} <span className="ml-1 text-xs font-normal text-muted-foreground">View entries</span></Button><div className="mt-3 flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => sendWhatsApp(row.whatsapp_number || row.phone)} aria-label="WhatsApp"><MessageCircle className="h-4 w-4 text-green-600"/></Button><Button variant="ghost" size="icon" onClick={() => navigate(`/agencies/${row.agency_id}/edit`)} aria-label="Edit agency"><Pencil className="h-4 w-4 text-blue-500"/></Button><Button variant="ghost" size="icon" onClick={() => void remove(row)} aria-label="Delete agency"><Trash2 className="h-4 w-4 text-destructive"/></Button></div></Card>)}{!shown.length && <Card className="p-8 text-center text-sm text-muted-foreground">No agencies found.</Card>}</div>
      </>}
    </div>
  </MainLayout>;
}

const blankAgency = (): Agency => ({ agency_name: "", status: "Active", wallet: 0 });
export function AgencyFormPage() {
  const { agencyId } = useParams<{ agencyId: string }>(); const navigate = useNavigate(); const [form,setForm]=useState<Agency>(blankAgency); const [states,setStates]=useState<State[]>([]); const [cities,setCities]=useState<City[]>([]); const [areas,setAreas]=useState<Area[]>([]); const [workTypes,setWorkTypes]=useState<WorkType[]>([]); const [loading,setLoading]=useState(Boolean(agencyId)); const [saving,setSaving]=useState(false);
  useEffect(() => { let active=true; Promise.all([stateService.getStates(companyId()),cityService.getCities(companyId()),areaService.getAreas(companyId())]).then(([s,c,a])=>{if(!active)return;setStates(s.data||[]);setCities(c.data||[]);setAreas(a.data||[]);}).catch((e:any)=>active&&fail("Could not load location options",e.message)); return()=>{active=false;}; },[]);
  useEffect(() => { let active=true; workTypeService.list(companyId()).then(result=>{if(active&&result.status==="success")setWorkTypes(result.data||[]);}).catch((e:any)=>active&&fail("Could not load work types",e.message)); return()=>{active=false;}; },[]);
  useEffect(() => { if(!agencyId)return;let active=true;agencyService.list(companyId()).then(result=>{if(!active)return;const row=result.data?.find(item=>String(item.agency_id)===agencyId);if(result.status==="success"&&row)setForm({...row});else{fail("Could not find agency",result.message);navigate("/agencies",{replace:true});}}).catch((e:any)=>active&&fail("Could not load agency",e.message)).finally(()=>active&&setLoading(false));return()=>{active=false;}; },[agencyId,navigate]);
  const set=(key:keyof Agency,value:any)=>setForm(current=>({...current,[key]:value}));
  const submit=async(event:FormEvent)=>{event.preventDefault();if(!form.agency_name.trim()){fail("Agency name is required");return;}setSaving(true);try{const result=await agencyService.save(form,companyId());if(result.status==="success"){toast({title:agencyId?"Agency updated":"Agency added"});navigate("/agencies");}else fail("Could not save agency",result.message);}catch(e:any){fail("Could not save agency",e.message);}finally{setSaving(false);}};
  return <MainLayout title={agencyId?"Edit Agency":"Add Agency"} subtitle="Agency contact and business details"><div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6"><Card className="p-4 md:p-6">{loading?<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>:<form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-1.5"><Label>Agency Name *</Label><Input className={inputClass} value={form.agency_name} onChange={e=>set("agency_name",e.target.value)} required/></div><div className="space-y-1.5"><Label>Firm Name</Label><Input className={inputClass} value={form.firm_name||""} onChange={e=>set("firm_name",e.target.value)}/></div>
    <div className="space-y-1.5"><Label>Contact Person</Label><Input className={inputClass} value={form.contact_person||""} onChange={e=>set("contact_person",e.target.value)}/></div><div className="space-y-1.5"><Label>Phone</Label><Input className={inputClass} value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div>
    <div className="space-y-1.5"><div className="flex items-center justify-between"><Label>WhatsApp Number</Label><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={!form.phone} onClick={()=>set("whatsapp_number",form.phone||"")}>Same as phone</Button></div><Input className={inputClass} value={form.whatsapp_number||""} onChange={e=>set("whatsapp_number",e.target.value)}/></div><div className="space-y-1.5"><Label>Email</Label><Input type="email" className={inputClass} value={form.email||""} onChange={e=>set("email",e.target.value)}/></div>
    <div className="space-y-1.5"><Label>State</Label><SearchableSelect options={states.map(x=>({value:String(x.state_id||""),label:x.state_name}))} value={form.state_id||""} onChange={value=>{set("state_id",value);set("city_id","");set("area_id","");}} placeholder="Select state" searchPlaceholder="Search states…"/></div>
    <div className="space-y-1.5"><Label>City</Label><SearchableSelect options={cities.filter(x=>!form.state_id||String(x.state_id||"")===form.state_id).map(x=>({value:String(x.city_id||""),label:x.city_name}))} value={form.city_id||""} onChange={value=>{set("city_id",value);set("area_id","");}} placeholder={form.state_id?"Select city":"Select state first"} searchPlaceholder="Search cities…" disabled={!form.state_id}/></div>
    <div className="space-y-1.5"><Label>Area</Label><SearchableSelect options={areas.filter(x=>String(x.city_id||"")===String(form.city_id||"")).map(x=>({value:String(x.area_id||""),label:x.area_name,sublabel:x.pincode}))} value={form.area_id||""} onChange={value=>set("area_id",value)} placeholder={form.city_id?"Select area":"Select city first"} searchPlaceholder="Search areas…" disabled={!form.city_id}/></div>
    <div className="space-y-1.5"><Label>GST Number</Label><Input className={inputClass} value={form.gst_number||""} onChange={e=>set("gst_number",e.target.value.toUpperCase())}/></div>{!agencyId&&<div className="space-y-1.5"><Label>Opening Wallet Balance (₹)</Label><Input type="number" min="0" step="0.01" className={inputClass} value={form.wallet??0} onChange={e=>set("wallet",Number(e.target.value))}/></div>}
    <div className="space-y-1.5 sm:col-span-2"><Label>Agency Work Types</Label><MultiSelectChips options={workTypes.map(item=>({value:String(item.work_type_id),label:`${item.work_type_id} · ${item.name}`}))} values={(form.work_type_ids||[]).map(String)} onChange={values=>set("work_type_ids",values)} placeholder="Select one or more agency work types"/>{workTypes.length===0&&<p className="text-xs text-muted-foreground">Add agency work types in Master first.</p>}</div><div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Textarea rows={3} value={form.address||""} onChange={e=>set("address",e.target.value)}/></div>
    <div className="flex items-center justify-between rounded-xl border px-3 py-2 sm:col-span-2"><div><Label>Status</Label><p className="text-xs text-muted-foreground">{form.status||"Active"}</p></div><Switch checked={(form.status||"Active")==="Active"} onCheckedChange={checked=>set("status",checked?"Active":"Inactive")} aria-label="Agency active status"/></div>
    </div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>navigate("/agencies")}>Cancel</Button><Button disabled={saving}>{saving?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving…</>:"Save Agency"}</Button></div></form>}</Card></div></MainLayout>;
}

const todayIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const walletMoney = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const walletDate = (value?: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
type AgencyWalletForm = { entry_id?: string; entry_date: string; entry_type: "Credit" | "Debit"; amount: string; remark: string };
const emptyWalletForm = (): AgencyWalletForm => ({ entry_date: todayIndia(), entry_type: "Credit", amount: "", remark: "" });

export function AgencyTransactionsPage() {
  const { agencyId = "" } = useParams<{ agencyId: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [agencyName, setAgencyName] = useState("Agency");
  const [balance, setBalance] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AgencyWalletForm>(emptyWalletForm);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result: any = await agencyService.ledger(agencyId, companyId());
      if (result.status === "success") {
        setRows(result.data || []);
        setAgencyName(result.agency?.agency_name || "Agency");
        setBalance(Number(result.agency?.wallet) || 0);
      } else fail("Could not load agency wallet", result.message);
    } catch (error: any) { fail("Could not load agency wallet", error.message); }
    finally { setLoading(false); }
  }, [agencyId]);
  useEffect(() => { if (agencyId) void load(); }, [agencyId, load]);
  const credits = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const debits = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const add = () => { setForm(emptyWalletForm()); setOpen(true); };
  const edit = (row: any) => setForm({ entry_id: String(row.entry_id), entry_date: String(row.transaction_date || todayIndia()).slice(0, 10), entry_type: row.transaction_type === "Debit" ? "Debit" : "Credit", amount: String(row.credit || row.debit || ""), remark: row.remark || "" });
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!(Number(form.amount) > 0)) { fail("Enter an amount greater than zero"); return; }
    setSaving(true);
    try {
      const payload = { company_id: companyId(), agency_id: agencyId, entry_id: form.entry_id, entry_date: form.entry_date, entry_type: form.entry_type, amount: Number(form.amount), remark: form.remark };
      const result = form.entry_id ? await agencyService.updateEntry(payload) : await agencyService.addEntry(payload);
      if (result.status === "success") { toast({ title: form.entry_id ? "Wallet entry updated" : "Wallet entry added" }); setOpen(false); await load(); }
      else fail("Could not save wallet entry", result.message);
    } catch (error: any) { fail("Could not save wallet entry", error.message); }
    finally { setSaving(false); }
  };
  const removeEntry = async (row: any) => {
    const accepted = await confirm({ title: "Delete Wallet Entry", message: `Delete this ${row.transaction_type.toLowerCase()} of ${walletMoney(row.credit || row.debit)}? The agency wallet will be adjusted.`, confirmText: "Delete", destructive: true });
    if (!accepted) return;
    try {
      const result = await agencyService.deleteEntry(companyId(), agencyId, String(row.entry_id));
      if (result.status === "success") { toast({ title: "Wallet entry deleted" }); await load(); }
      else fail("Could not delete wallet entry", result.message);
    } catch (error: any) { fail("Could not delete wallet entry", error.message); }
  };
  return <MainLayout title="Agency Wallet" subtitle={`${agencyName} · wallet entries and balance`}>
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" onClick={() => navigate("/agencies")}>← Back to Agencies</Button><Button onClick={add}><Plus className="mr-2 h-4 w-4"/>Add Wallet Entry</Button></div>
      <div className="grid gap-3 sm:grid-cols-3"><Card className="flex items-center gap-3 p-4"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Wallet className="h-5 w-5"/></div><div><p className="text-sm text-muted-foreground">Current wallet</p><p className="text-xl font-semibold">{walletMoney(balance)}</p></div></Card><Card className="flex items-center gap-3 p-4"><div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600"><ArrowUpRight className="h-5 w-5"/></div><div><p className="text-sm text-muted-foreground">Total credits</p><p className="text-xl font-semibold">{walletMoney(credits)}</p></div></Card><Card className="flex items-center gap-3 p-4"><div className="rounded-xl bg-amber-500/10 p-2 text-amber-600"><ArrowDownLeft className="h-5 w-5"/></div><div><p className="text-sm text-muted-foreground">Total debits</p><p className="text-xl font-semibold">{walletMoney(debits)}</p></div></Card></div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-muted/50"><tr>{["Date","Entry ID","Type","Remark","Debit","Credit","Balance","Actions"].map(label => <th key={label} className="px-4 py-3 text-left font-medium text-muted-foreground">{label}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row,index) => <tr key={`${row.transaction_id}-${index}`} className="hover:bg-muted/30"><td className="px-4 py-3">{walletDate(row.transaction_date)}</td><td className="px-4 py-3 font-mono">{row.transaction_id}</td><td className="px-4 py-3"><Badge variant="outline">{row.transaction_type}</Badge>{Number(row.is_locked)===1&&<p className="mt-1 text-[10px] text-muted-foreground">Quotation locked</p>}</td><td className="px-4 py-3"><p>{row.reference}</p><p className="text-xs text-muted-foreground">{row.remark || "—"}</p></td><td className="px-4 py-3 text-right">{Number(row.debit) ? walletMoney(row.debit) : "—"}</td><td className="px-4 py-3 text-right">{Number(row.credit) ? walletMoney(row.credit) : "—"}</td><td className="px-4 py-3 text-right font-semibold">{walletMoney(row.balance)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1">{row.entry_id && Number(row.is_locked)!==1 && <><Button variant="ghost" size="icon" onClick={() => edit(row)} aria-label="Edit wallet entry"><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={() => void removeEntry(row)} aria-label="Delete wallet entry"><Trash2 className="h-4 w-4 text-destructive"/></Button></>}</div></td></tr>)}{!loading && rows.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No wallet entries found.</td></tr>}</tbody>{rows.length > 0 && <tfoot className="bg-muted/40 font-semibold"><tr><td colSpan={4} className="px-4 py-3 text-right">Totals</td><td className="px-4 py-3 text-right">{walletMoney(debits)}</td><td className="px-4 py-3 text-right">{walletMoney(credits)}</td><td className="px-4 py-3 text-right">{walletMoney(balance)}</td><td/></tr></tfoot>}</table></div>{loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}</Card>
    </div>
    <Dialog open={open} onOpenChange={value => !saving && setOpen(value)}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{form.entry_id ? "Edit Wallet Entry" : "Add Wallet Entry"}</DialogTitle><DialogDescription>Credits increase the agency wallet; debits decrease it. Saving adjusts the current balance immediately.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Date *</Label><Input required type="date" className={inputClass} value={form.entry_date} onChange={event => setForm(current => ({ ...current, entry_date: event.target.value }))}/></div><div className="space-y-1.5"><Label>Entry Type *</Label><div className="flex h-10 rounded-xl border bg-muted p-1" role="group" aria-label="Entry type"><Button type="button" size="sm" variant={form.entry_type === "Credit" ? "default" : "ghost"} className="h-full flex-1 rounded-lg" aria-pressed={form.entry_type === "Credit"} onClick={() => setForm(current => ({ ...current, entry_type: "Credit" }))}>Credit</Button><Button type="button" size="sm" variant={form.entry_type === "Debit" ? "destructive" : "ghost"} className="h-full flex-1 rounded-lg" aria-pressed={form.entry_type === "Debit"} onClick={() => setForm(current => ({ ...current, entry_type: "Debit" }))}>Debit</Button></div><p className="text-xs text-muted-foreground">{form.entry_type === "Credit" ? "Adds to the agency wallet" : "Deducts from the agency wallet"}</p></div><div className="space-y-1.5 sm:col-span-2"><Label>Amount (₹) *</Label><Input required type="number" min="0.01" step="0.01" className={inputClass} value={form.amount} onChange={event => setForm(current => ({ ...current, amount: event.target.value }))}/></div><div className="space-y-1.5 sm:col-span-2"><Label>Remark</Label><Textarea rows={3} value={form.remark} onChange={event => setForm(current => ({ ...current, remark: event.target.value }))} placeholder="Add a note for this wallet entry"/></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving}>{saving ? "Saving…" : form.entry_id ? "Update Entry" : "Save Entry"}</Button></DialogFooter></form></DialogContent></Dialog>
  </MainLayout>;
}
