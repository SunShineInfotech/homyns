import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { employeeService, Employee } from "@/services/employee.service";
import { RawMaterial, rawMaterialService } from "@/services/raw-material.service";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { stockService, Warehouse } from "@/services/stock.service";
import { Vendor, vendorService } from "@/services/vendor-purchasing.service";
import { Eye, Loader2, PackagePlus, Plus, ShoppingCart, Trash2, X } from "lucide-react";

const companyId = () => { try { return String(JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""); } catch { return ""; } };
const currentEmployeeId = () => { try { const user = JSON.parse(localStorage.getItem("user_data") || "{}"); return String(user.emp_id || user.employee_id || ""); } catch { return ""; } };
const todayIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const money = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value?: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const fieldClass = "h-10 rounded-xl";
type OrderLine = { key: string; material_id: string; quantity: string; rate: string; gst_percent: string };
const blankLine = (): OrderLine => ({ key: `${Date.now()}-${Math.random()}`, material_id: "", quantity: "1", rate: "0", gst_percent: "0" });
const errorToast = (title: string, description?: string) => toast({ title, description: description || "Please try again.", variant: "destructive" });

export default function PurchaseOrdersPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]); const [employees, setEmployees] = useState<Employee[]>([]); const [warehouses, setWarehouses] = useState<Warehouse[]>([]); const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [orders, setOrders] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [showForm, setShowForm] = useState(false); const [detail, setDetail] = useState<any | null>(null); const [detailLoading, setDetailLoading] = useState(false);
  const [orderDate, setOrderDate] = useState(todayIndia()); const [expectedDate, setExpectedDate] = useState(""); const [vendorId, setVendorId] = useState(""); const [generatedBy, setGeneratedBy] = useState(currentEmployeeId()); const [warehouseId, setWarehouseId] = useState(""); const [remark, setRemark] = useState(""); const [lines, setLines] = useState<OrderLine[]>([blankLine()]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cid = companyId();
      const [orderResult, vendorResult, employeeResult, warehouseResult, materialResult] = await Promise.all([
        purchaseOrderService.list(cid), vendorService.list(cid), employeeService.getEmployees(cid), stockService.warehouses(cid), rawMaterialService.getRawMaterials(cid),
      ]);
      if (orderResult.status === "success") setOrders(orderResult.data || []); else errorToast("Could not load purchase orders", orderResult.message);
      if (vendorResult.status === "success") setVendors((vendorResult.data || []).filter(v => v.status !== "Inactive"));
      if (employeeResult.status === "success") setEmployees((employeeResult.data || []).filter(e => e.status !== "Inactive"));
      if (warehouseResult.status === "success") setWarehouses((warehouseResult.data || []).filter(w => w.status !== "Inactive"));
      if (materialResult.status === "success") setMaterials((materialResult.data || []).filter(m => m.status !== "Inactive"));
    } catch (e: any) { errorToast("Could not load purchase order data", e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const lineDetails = (line: OrderLine) => {
    const material = materials.find(m => String(m.rm_id) === line.material_id);
    const qty = Number(line.quantity) || 0; const rate = Number(line.rate) || 0; const gst = Number(line.gst_percent) || 0;
    const base = qty * rate; const tax = base * gst / 100;
    return { material, base, tax, total: base + tax };
  };
  const totals = useMemo(() => lines.reduce((sum, line) => { const value = lineDetails(line); sum.subtotal += value.base; sum.gst += value.tax; sum.total += value.total; return sum; }, { subtotal: 0, gst: 0, total: 0 }), [lines, materials]);
  const patchLine = (key: string, patch: Partial<OrderLine>) => setLines(current => current.map(line => line.key === key ? { ...line, ...patch } : line));
  const addLine = () => setLines(current => [...current, blankLine()]);
  const removeLine = (key: string) => setLines(current => current.length === 1 ? [blankLine()] : current.filter(line => line.key !== key));
  const startOrder = () => {
    if (!vendors.length || !warehouses.length || !materials.length || !employees.length) {
      errorToast("Purchase order setup is incomplete", !warehouses.length ? "Add an active warehouse first." : !vendors.length ? "Add an active vendor first." : !materials.length ? "Add an active raw material first." : "Add an active employee first.");
      return;
    }
    setOrderDate(todayIndia()); setExpectedDate(""); setVendorId(""); setGeneratedBy(currentEmployeeId() || String(employees[0]?.emp_id || "")); setWarehouseId(String(warehouses[0]?.warehouse_id || "")); setRemark(""); setLines([blankLine()]); setShowForm(true);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validLines = lines.filter(line => line.material_id && Number(line.quantity) > 0 && Number(line.rate) >= 0 && Number(line.gst_percent) >= 0);
    if (!vendorId || !generatedBy || !warehouseId || !validLines.length) { errorToast("Complete all required fields", "Choose a vendor, employee, warehouse, and at least one material with quantity."); return; }
    setSaving(true);
    try {
      const result = await purchaseOrderService.create({ company_id: companyId(), order_date: orderDate, vendor_id: vendorId, generated_by: generatedBy, warehouse_id: warehouseId, expected_delivery_date: expectedDate, remark, items: validLines.map(line => ({ material_id: line.material_id, quantity: Number(line.quantity), rate: Number(line.rate), gst_percent: Number(line.gst_percent) })) });
      if (result.status !== "success") { errorToast("Could not create purchase order", result.message); return; }
      toast({ title: "Purchase order created", description: `${result.po_number || "Order"} · ${money(result.total_amount)}` }); setShowForm(false); await load();
    } catch (e: any) { errorToast("Could not create purchase order", e.message); }
    finally { setSaving(false); }
  };
  const openDetail = async (id: string) => { setDetailLoading(true); setDetail({ loading: true }); try { const result = await purchaseOrderService.detail(companyId(), id); if (result.status === "success") setDetail(result.data); else { setDetail(null); errorToast("Could not open purchase order", result.message); } } catch (e: any) { setDetail(null); errorToast("Could not open purchase order", e.message); } finally { setDetailLoading(false); } };
  const changeOrderStatus = async (order: any, status: string) => {
    if (!order?.purchase_order_id || order.status === status) return;
    setSaving(true);
    try {
      const result = await purchaseOrderService.updateStatus(companyId(), String(order.purchase_order_id), status);
      if (result.status === "success") {
        toast({ title: "Purchase order status updated", description: status });
        setDetail((current: any) => current?.purchase_order_id === order.purchase_order_id ? { ...current, status } : current);
        setOrders(current => current.map(item => item.purchase_order_id === order.purchase_order_id ? { ...item, status } : item));
      } else errorToast("Could not update purchase order status", result.message);
    } catch (e: any) { errorToast("Could not update purchase order status", e.message); }
    finally { setSaving(false); }
  };

  return <MainLayout title="Purchase Orders" subtitle="Create and track vendor orders for raw materials">
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-3 text-primary"><ShoppingCart className="h-5 w-5" /></span><div><h2 className="font-semibold">Purchase Orders</h2><p className="text-sm text-muted-foreground">Create vendor orders and update their status in one place.</p></div></div><Button onClick={startOrder}><Plus className="mr-2 h-4 w-4" />Create Purchase Order</Button></Card>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : <>
        <div className="hidden overflow-x-auto rounded-2xl border bg-card md:block"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/50"><tr>{["PO Number", "Date", "Vendor", "Warehouse", "Expected Delivery", "Items", "Total", "Status", ""].map(title => <th key={title} className="px-4 py-3 text-left font-medium text-muted-foreground">{title}</th>)}</tr></thead><tbody className="divide-y">{orders.map(order => <tr key={order.purchase_order_id} className="hover:bg-muted/30"><td className="px-4 py-3 font-mono font-medium">{order.po_number}</td><td className="px-4 py-3">{dateLabel(order.order_date)}</td><td className="px-4 py-3">{order.vendor_name}</td><td className="px-4 py-3">{order.warehouse_name}</td><td className="px-4 py-3">{dateLabel(order.expected_delivery_date)}</td><td className="px-4 py-3">{order.item_count || 0}</td><td className="px-4 py-3 font-semibold">{money(order.total_amount)}</td><td className="px-4 py-3"><select aria-label={`Status for ${order.po_number}`} className="h-9 rounded-md border bg-background px-2 text-sm" value={order.status || "Pending"} disabled={saving} onChange={e => void changeOrderStatus(order, e.target.value)}>{["Pending", "Approved", "Received", "Cancelled"].map(status => <option key={status}>{status}</option>)}</select></td><td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => void openDetail(String(order.purchase_order_id))}><Eye className="mr-1 h-4 w-4" />View</Button></td></tr>)}{!orders.length && <tr><td colSpan={9} className="p-12 text-center text-muted-foreground">No purchase orders yet. Create one to request materials from a vendor.</td></tr>}</tbody></table></div>
        <div className="space-y-3 md:hidden">{orders.map(order => <Card key={order.purchase_order_id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono font-semibold">{order.po_number}</p><p className="text-sm text-muted-foreground">{order.vendor_name}</p></div><select aria-label={`Status for ${order.po_number}`} className="h-9 rounded-md border bg-background px-2 text-xs" value={order.status || "Pending"} disabled={saving} onChange={e => void changeOrderStatus(order, e.target.value)}>{["Pending", "Approved", "Received", "Cancelled"].map(status => <option key={status}>{status}</option>)}</select></div><div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Order date: {dateLabel(order.order_date)}</span><span>Delivery: {dateLabel(order.expected_delivery_date)}</span><span>Warehouse: {order.warehouse_name}</span><span>{order.item_count || 0} materials</span></div><div className="flex items-center justify-between border-t pt-3"><span className="font-semibold">{money(order.total_amount)}</span><Button size="sm" variant="outline" onClick={() => void openDetail(String(order.purchase_order_id))}><Eye className="mr-1 h-4 w-4" />View</Button></div></Card>)}{!orders.length && <Card className="p-8 text-center text-sm text-muted-foreground">No purchase orders yet.</Card>}</div>
      </>}
    </div>

    <Dialog open={showForm} onOpenChange={open => !saving && setShowForm(open)}><DialogContent className="max-h-[92dvh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Create Purchase Order</DialogTitle><DialogDescription>Select the vendor and delivery warehouse, then add one or more raw materials.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5"><Label>Order Date *</Label><Input required type="date" className={fieldClass} value={orderDate} onChange={e => setOrderDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Vendor *</Label><select required className={`${fieldClass} w-full rounded-md border bg-background px-3 text-sm`} value={vendorId} onChange={e => setVendorId(e.target.value)}><option value="">Select vendor</option>{vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}{v.firm_name ? ` · ${v.firm_name}` : ""}</option>)}</select></div>
          <div className="space-y-1.5"><Label>Generated By *</Label><select required className={`${fieldClass} w-full rounded-md border bg-background px-3 text-sm`} value={generatedBy} onChange={e => setGeneratedBy(e.target.value)}><option value="">Select employee</option>{employees.map(e => <option key={e.emp_id} value={e.emp_id}>{e.name}{e.employee_number ? ` · ${e.employee_number}` : ""}</option>)}</select></div>
          <div className="space-y-1.5"><Label>Warehouse *</Label><select required className={`${fieldClass} w-full rounded-md border bg-background px-3 text-sm`} value={warehouseId} onChange={e => setWarehouseId(e.target.value)}><option value="">Select warehouse</option>{warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_name}</option>)}</select></div>
          <div className="space-y-1.5"><Label>Expected Delivery Date</Label><Input type="date" min={orderDate} className={fieldClass} value={expectedDate} onChange={e => setExpectedDate(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Remark</Label><Input className={fieldClass} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Optional notes" /></div>
        </div>
        <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-semibold">Materials</h3><p className="text-xs text-muted-foreground">Enter quantity, rate and GST for each material.</p></div><Button type="button" size="sm" variant="outline" onClick={addLine}><PackagePlus className="mr-2 h-4 w-4" />Add Material</Button></div>
          <div className="hidden overflow-x-auto rounded-xl border md:block"><table className="w-full min-w-[820px] text-sm"><thead className="bg-muted/50"><tr>{["Material", "Qty", "Rate (₹)", "GST %", "Total", ""].map(h => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody className="divide-y">{lines.map(line => { const detail = lineDetails(line); return <tr key={line.key}><td className="min-w-64 px-3 py-2"><select required aria-label="Material" className="h-10 w-full rounded-md border bg-background px-3" value={line.material_id} onChange={e => { const selected = materials.find(m => String(m.rm_id) === e.target.value); patchLine(line.key, { material_id: e.target.value, rate: String(selected?.cost_price || 0) }); }}><option value="">Select material</option>{materials.map(m => <option key={m.rm_id} value={m.rm_id}>{m.rm_name}{m.unit_name ? ` (${m.unit_name})` : ""}</option>)}</select></td><td className="w-28 px-2 py-2"><Input aria-label="Quantity" type="number" min="0.001" step="0.001" value={line.quantity} onChange={e => patchLine(line.key, { quantity: e.target.value })} /></td><td className="w-36 px-2 py-2"><Input aria-label="Rate" type="number" min="0" step="0.01" value={line.rate} onChange={e => patchLine(line.key, { rate: e.target.value })} /></td><td className="w-28 px-2 py-2"><Input aria-label="GST percent" type="number" min="0" max="100" step="0.01" value={line.gst_percent} onChange={e => patchLine(line.key, { gst_percent: e.target.value })} /></td><td className="whitespace-nowrap px-3 py-2 font-medium">{money(detail.total)}</td><td className="px-2 py-2"><Button type="button" size="icon" variant="ghost" aria-label="Remove material" onClick={() => removeLine(line.key)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>; })}</tbody></table></div>
          <div className="space-y-3 md:hidden">{lines.map((line, index) => { const detail = lineDetails(line); return <Card key={line.key} className="space-y-3 p-3"><div className="flex items-center justify-between"><Label>Material {index + 1}</Label><Button type="button" size="icon" variant="ghost" aria-label="Remove material" onClick={() => removeLine(line.key)}><X className="h-4 w-4 text-destructive" /></Button></div><select required aria-label="Material" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={line.material_id} onChange={e => { const selected = materials.find(m => String(m.rm_id) === e.target.value); patchLine(line.key, { material_id: e.target.value, rate: String(selected?.cost_price || 0) }); }}><option value="">Select material</option>{materials.map(m => <option key={m.rm_id} value={m.rm_id}>{m.rm_name}{m.unit_name ? ` (${m.unit_name})` : ""}</option>)}</select><div className="grid grid-cols-3 gap-2"><div><Label className="text-xs">Qty</Label><Input type="number" min="0.001" step="0.001" value={line.quantity} onChange={e => patchLine(line.key, { quantity: e.target.value })} /></div><div><Label className="text-xs">Rate ₹</Label><Input type="number" min="0" step="0.01" value={line.rate} onChange={e => patchLine(line.key, { rate: e.target.value })} /></div><div><Label className="text-xs">GST %</Label><Input type="number" min="0" max="100" step="0.01" value={line.gst_percent} onChange={e => patchLine(line.key, { gst_percent: e.target.value })} /></div></div><p className="text-right text-sm font-semibold">Line Total: {money(detail.total)}</p></Card>; })}</div>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-4 text-sm sm:ml-auto sm:w-72"><div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div><div className="flex justify-between"><span>GST</span><span>{money(totals.gst)}</span></div><div className="mt-1 flex justify-between border-t pt-2 text-base font-semibold"><span>Grand Total</span><span>{money(totals.total)}</span></div></div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Create Purchase Order"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>

    <Dialog open={Boolean(detail)} onOpenChange={open => !open && !saving && setDetail(null)}><DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{detail?.loading ? "Loading purchase order…" : detail?.po_number || "Purchase Order"}</DialogTitle><DialogDescription>{detail?.loading ? "" : `${detail?.vendor_name || ""} · ${dateLabel(detail?.order_date)}`}</DialogDescription></DialogHeader>{detailLoading || detail?.loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : detail && <div className="space-y-4"><div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><div><span className="text-muted-foreground">Generated by</span><p className="font-medium">{detail.generated_by_name}</p></div><div><span className="text-muted-foreground">Warehouse</span><p className="font-medium">{detail.warehouse_name}</p></div><div><span className="text-muted-foreground">Expected delivery</span><p className="font-medium">{dateLabel(detail.expected_delivery_date)}</p></div><div><span className="text-muted-foreground">Vendor phone</span><p className="font-medium">{detail.vendor_phone || "—"}</p></div><div><span className="text-muted-foreground">Status</span><select aria-label="Purchase order status" className="mt-1 h-9 rounded-md border bg-background px-2 text-sm" value={detail.status || "Pending"} disabled={saving} onChange={e => void changeOrderStatus(detail, e.target.value)}>{["Pending", "Approved", "Received", "Cancelled"].map(status => <option key={status}>{status}</option>)}</select></div><div><span className="text-muted-foreground">Order date</span><p className="font-medium">{dateLabel(detail.order_date)}</p></div></div><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[600px] text-sm"><thead className="bg-muted/50"><tr>{["Material", "Qty", "Rate", "GST", "Total"].map(h => <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody className="divide-y">{(detail.items || []).map((item: any) => <tr key={item.purchase_order_item_id}><td className="px-3 py-3">{item.material_name}<span className="ml-1 text-xs text-muted-foreground">{item.unit_name}</span></td><td className="px-3 py-3">{item.quantity}</td><td className="px-3 py-3">{money(item.rate)}</td><td className="px-3 py-3">{item.gst_percent}%</td><td className="px-3 py-3 font-medium">{money(item.line_total)}</td></tr>)}</tbody></table></div><div className="ml-auto max-w-xs space-y-1 rounded-xl bg-muted/50 p-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(detail.subtotal)}</span></div><div className="flex justify-between"><span>GST</span><span>{money(detail.gst_amount)}</span></div><div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Grand Total</span><span>{money(detail.total_amount)}</span></div></div></div>}<DialogFooter><Button variant="outline" onClick={() => setDetail(null)}><X className="mr-2 h-4 w-4" />Close</Button></DialogFooter></DialogContent></Dialog>
  </MainLayout>;
}
