import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Loader2, PackagePlus, Plus, Save, ShoppingCart, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "@/hooks/use-toast";
import { Employee, employeeService } from "@/services/employee.service";
import { Product, productService } from "@/services/product.service";
import { RawMaterial, rawMaterialService } from "@/services/raw-material.service";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { stockService, Warehouse } from "@/services/stock.service";
import { Vendor, vendorService } from "@/services/vendor-purchasing.service";

const companyId = () => { try { return String(JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""); } catch { return ""; } };
const currentEmployeeId = () => { try { const user = JSON.parse(localStorage.getItem("user_data") || "{}"); return String(user.emp_id || user.employee_id || ""); } catch { return ""; } };
const todayIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const money = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value?: string) => value ? new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const fieldClass = "h-10 rounded-xl";
const STATUSES = ["Pending", "Approved", "Received", "Cancelled"];
type ItemType = "raw_material" | "product";
type OrderLine = { key: string; item_type: ItemType; item_id: string; quantity: string; rate: string; gst_percent: string };
const blankLine = (): OrderLine => ({ key: `${Date.now()}-${Math.random()}`, item_type: "raw_material", item_id: "", quantity: "1", rate: "0", gst_percent: "0" });
const errorToast = (title: string, description?: string) => toast({ title, description: description || "Please try again.", variant: "destructive" });

export default function PurchaseOrderPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { id } = useParams();
  // `/purchase-orders/new` is an explicit route, so React Router does not
  // populate `:id` for it. Detect the pathname as well as the param.
  const isCreate = id === "new" || pathname.endsWith("/purchase-orders/new");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderDate, setOrderDate] = useState(todayIndia());
  const [expectedDate, setExpectedDate] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [remark, setRemark] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([blankLine()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cid = companyId();
      const [orderResult, vendorResult, employeeResult, warehouseResult, materialResult, productResult] = await Promise.all([
        purchaseOrderService.list(cid), vendorService.list(cid), employeeService.getEmployees(cid), stockService.warehouses(cid), rawMaterialService.getRawMaterials(cid), productService.getProducts(cid),
      ]);
      if (orderResult.status === "success") setOrders(orderResult.data || []); else errorToast("Could not load purchase orders", orderResult.message);
      if (vendorResult.status === "success") setVendors((vendorResult.data || []).filter(v => v.status !== "Inactive"));
      if (employeeResult.status === "success") setEmployees((employeeResult.data || []).filter(e => e.status !== "Inactive"));
      if (warehouseResult.status === "success") setWarehouses((warehouseResult.data || []).filter(w => w.status !== "Inactive"));
      if (materialResult.status === "success") setMaterials((materialResult.data || []).filter(m => m.status !== "Inactive"));
      if (productResult.status === "success") setProducts((productResult.data || []).filter(p => p.status !== "Inactive"));
    } catch (e: any) { errorToast("Could not load purchase order data", e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    if (!id || isCreate) { setDetail(null); return; }
    setLoading(true);
    void purchaseOrderService.detail(companyId(), id).then(result => {
      if (!active) return;
      if (result.status === "success") setDetail(result.data);
      else { setDetail(null); errorToast("Could not open purchase order", result.message); }
    }).catch((e: any) => { if (active) errorToast("Could not open purchase order", e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isCreate]);

  useEffect(() => {
    if (!warehouseId && warehouses.length) setWarehouseId(String(warehouses[0].warehouse_id || ""));
  }, [warehouses, warehouseId]);

  const optionsFor = (type: ItemType) => type === "raw_material"
    ? materials.map(m => ({ value: String(m.rm_id), label: m.rm_name, sublabel: m.unit_name || "Raw material" }))
    : products.map(p => ({ value: String(p.product_id), label: p.product_name, sublabel: p.dimension_unit_name || "Product" }));
  const selectedItem = (line: OrderLine) => line.item_type === "raw_material"
    ? materials.find(m => String(m.rm_id) === line.item_id)
    : products.find(p => String(p.product_id) === line.item_id);
  const lineDetails = (line: OrderLine) => {
    const item = selectedItem(line); const base = (Number(line.quantity) || 0) * (Number(line.rate) || 0);
    const tax = base * (Number(line.gst_percent) || 0) / 100;
    return { item, base, tax, total: base + tax };
  };
  const totals = useMemo(() => lines.reduce((sum, line) => { const x = lineDetails(line); sum.subtotal += x.base; sum.gst += x.tax; sum.total += x.total; return sum; }, { subtotal: 0, gst: 0, total: 0 }), [lines, materials, products]);
  const patchLine = (key: string, patch: Partial<OrderLine>) => setLines(current => current.map(line => line.key === key ? { ...line, ...patch } : line));
  const addLine = () => setLines(current => [...current, blankLine()]);
  const removeLine = (key: string) => setLines(current => current.length === 1 ? [blankLine()] : current.filter(line => line.key !== key));
  const startOrder = () => {
    if (!vendors.length || !warehouses.length || (!materials.length && !products.length) || !employees.length) {
      errorToast("Purchase order setup is incomplete", !warehouses.length ? "Add an active warehouse first." : !vendors.length ? "Add an active vendor first." : !materials.length && !products.length ? "Add an active raw material or product first." : !employees.length ? "Add an active employee first." : "Please complete the setup first.");
      return;
    }
    setOrderDate(todayIndia()); setExpectedDate(""); setVendorId(""); setWarehouseId(String(warehouses[0]?.warehouse_id || "")); setRemark(""); setLines([blankLine()]); navigate("/purchase-orders/new");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const loggedInEmployee = currentEmployeeId();
    const generatedBy = String(employees.find(employee => String(employee.emp_id) === loggedInEmployee)?.emp_id || employees[0]?.emp_id || "");
    const validLines = lines.filter(line => line.item_id && Number(line.quantity) > 0 && (line.item_type !== "product" || Number.isInteger(Number(line.quantity))) && Number(line.rate) >= 0 && Number(line.gst_percent) >= 0);
    if (!vendorId || !generatedBy || !warehouseId || !validLines.length) { errorToast("Complete all required fields", "Choose a vendor, warehouse, and at least one item with a valid quantity."); return; }
    setSaving(true);
    try {
      const result = await purchaseOrderService.create({ company_id: companyId(), order_date: orderDate, vendor_id: vendorId, generated_by: generatedBy, warehouse_id: warehouseId, expected_delivery_date: expectedDate, remark, items: validLines.map(line => ({ item_type: line.item_type, material_id: line.item_id, quantity: line.item_type === "product" ? Math.trunc(Number(line.quantity)) : Number(line.quantity), rate: Number(line.rate), gst_percent: Number(line.gst_percent) })) });
      if (result.status !== "success") { errorToast("Could not create purchase order", result.message); return; }
      toast({ title: "Purchase order created", description: `${result.po_number || "Order"} · ${money(result.total_amount)}` });
      await load(); navigate("/purchase-orders");
    } catch (e: any) { errorToast("Could not create purchase order", e.message); }
    finally { setSaving(false); }
  };
  const changeStatus = async (order: any, status: string) => {
    if (!order?.purchase_order_id || order.status === status) return;
    setSaving(true);
    try {
      const result = await purchaseOrderService.updateStatus(companyId(), String(order.purchase_order_id), status);
      if (result.status !== "success") { errorToast("Could not update status", result.message); return; }
      setDetail((current: any) => current && String(current.purchase_order_id) === String(order.purchase_order_id) ? { ...current, status } : current);
      setOrders(current => current.map(item => String(item.purchase_order_id) === String(order.purchase_order_id) ? { ...item, status } : item));
      toast({ title: "Purchase order status updated", description: status });
    } catch (e: any) { errorToast("Could not update status", e.message); }
    finally { setSaving(false); }
  };

  const vendorOptions = vendors.map(v => ({ value: String(v.vendor_id), label: v.vendor_name, sublabel: v.firm_name || v.phone || "" }));
  const warehouseOptions = warehouses.map(w => ({ value: String(w.warehouse_id), label: w.warehouse_name, sublabel: w.address || "" }));
  const pageTitle = isCreate ? "Create Purchase Order" : detail ? detail.po_number || "Purchase Order" : "Purchase Orders";

  return <MainLayout title={pageTitle} subtitle={isCreate ? "Add vendor and item details for this order" : "Create and manage vendor orders in one place"}>
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      {isCreate ? <>
        <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" onClick={() => navigate("/purchase-orders")}><ArrowLeft className="mr-2 h-4 w-4"/>Back to Purchase Orders</Button><div className="text-sm text-muted-foreground">Status: <strong className="text-foreground">Pending</strong></div></div>
        <Card className="p-4 md:p-6"><form onSubmit={submit} className="space-y-6">
          <section className="space-y-3"><h2 className="text-base font-semibold">Order Details</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label>Order Date *</Label><Input required type="date" className={fieldClass} value={orderDate} onChange={e => setOrderDate(e.target.value)}/></div>
            <div className="space-y-1.5"><Label>Vendor *</Label><SearchableSelect options={vendorOptions} value={vendorId} onChange={setVendorId} placeholder="Select vendor" searchPlaceholder="Search vendors…"/></div>
            <div className="space-y-1.5"><Label>Warehouse *</Label><SearchableSelect options={warehouseOptions} value={warehouseId} onChange={setWarehouseId} placeholder="Select warehouse" searchPlaceholder="Search warehouses…"/></div>
            <div className="space-y-1.5"><Label>Expected Delivery Date</Label><Input type="date" min={orderDate} className={fieldClass} value={expectedDate} onChange={e => setExpectedDate(e.target.value)}/></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Remark</Label><Input className={fieldClass} value={remark} onChange={e => setRemark(e.target.value)} placeholder="Optional notes"/></div>
          </div></section>
          <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Order Items</h2><p className="text-sm text-muted-foreground">Choose a raw material or product for each line.</p></div><Button type="button" variant="outline" onClick={addLine}><PackagePlus className="mr-2 h-4 w-4"/>Add Item</Button></div>
            <div className="space-y-3">{lines.map((line, index) => { const d = lineDetails(line); return <Card key={line.key} className="p-3 md:p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-medium">Item {index + 1}</h3><Button type="button" size="icon" variant="ghost" aria-label="Remove item" onClick={() => removeLine(line.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div><div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_2fr_1fr_1fr_1fr_1.2fr]">
              <div className="space-y-1.5"><Label>Type</Label><select className={`${fieldClass} w-full rounded-md border bg-background px-3 text-sm`} value={line.item_type} onChange={e => { const item_type = e.target.value as ItemType; patchLine(line.key, { item_type, item_id: "", rate: "0", gst_percent: "0", quantity: item_type === "product" ? String(Math.max(1, Math.trunc(Number(line.quantity) || 1))) : line.quantity }); }}><option value="raw_material">Raw Material</option><option value="product">Product</option></select></div>
              <div className="space-y-1.5"><Label>{line.item_type === "raw_material" ? "Raw Material" : "Product"} *</Label><SearchableSelect options={optionsFor(line.item_type)} value={line.item_id} onChange={value => { const picked = line.item_type === "raw_material" ? materials.find(m => String(m.rm_id) === value) : products.find(p => String(p.product_id) === value); patchLine(line.key, { item_id: value, rate: String(line.item_type === "raw_material" ? picked?.cost_price || 0 : picked?.price || 0), gst_percent: String(picked?.gst_percent || 0) }); }} placeholder={`Select ${line.item_type === "raw_material" ? "raw material" : "product"}`} searchPlaceholder={`Search ${line.item_type === "raw_material" ? "raw materials" : "products"}…`}/></div>
              <div className="space-y-1.5"><Label>Qty *</Label><Input required type="number" min={line.item_type === "product" ? "1" : "0.001"} step={line.item_type === "product" ? "1" : "0.001"} className={fieldClass} value={line.quantity} onChange={e => { const value=e.target.value; patchLine(line.key, { quantity: value === "" ? "" : line.item_type === "product" ? String(Math.trunc(Number(value))) : value }); }}/></div>
              <div className="space-y-1.5"><Label>Rate (₹) *</Label><Input required type="number" min="0" step="0.01" className={fieldClass} value={line.rate} onChange={e => patchLine(line.key, { rate: e.target.value })}/></div>
              <div className="space-y-1.5"><Label>GST %</Label><Input type="number" min="0" max="100" step="0.01" className={fieldClass} value={line.gst_percent} onChange={e => patchLine(line.key, { gst_percent: e.target.value })}/></div>
              <div className="space-y-1.5"><Label>Total</Label><div className="flex h-10 items-center rounded-xl bg-muted px-3 text-sm font-semibold">{money(d.total)}</div></div>
            </div></Card>; })}</div>
          </section>
          <div className="ml-auto max-w-sm space-y-1 rounded-xl bg-muted/50 p-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div><div className="flex justify-between"><span>GST</span><span>{money(totals.gst)}</span></div><div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Grand Total</span><span>{money(totals.total)}</span></div></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => navigate("/purchase-orders")} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving…</> : <><Save className="mr-2 h-4 w-4"/>Save Purchase Order</>}</Button></div>
        </form></Card>
      </> : id ? <>
        <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="outline" onClick={() => navigate("/purchase-orders")}><ArrowLeft className="mr-2 h-4 w-4"/>Back to Purchase Orders</Button>{detail && <label className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Status</span><select className={`${fieldClass} rounded-md border bg-background px-3`} value={detail.status || "Pending"} disabled={saving} onChange={e => void changeStatus(detail, e.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>}</div>
        {loading || !detail ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div> : <>
          <Card className="p-4 md:p-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Vendor", detail.vendor_name], ["Order Date", dateLabel(detail.order_date)], ["Warehouse", detail.warehouse_name], ["Expected Delivery", dateLabel(detail.expected_delivery_date)], ["Vendor Phone", detail.vendor_phone || "—"]].map(([label, value]) => <div key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value || "—"}</p></div>)}</div>{detail.remark && <div className="mt-4 border-t pt-4"><p className="text-sm text-muted-foreground">Remark</p><p className="mt-1">{detail.remark}</p></div>}</Card>
          <Card className="overflow-hidden"><div className="border-b p-4"><h2 className="font-semibold">Items</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-muted/50"><tr>{["Type", "Item", "Quantity", "Rate", "GST", "Total"].map(title => <th key={title} className="px-4 py-3 text-left font-medium text-muted-foreground">{title}</th>)}</tr></thead><tbody className="divide-y">{(detail.items || []).map((item: any) => <tr key={item.purchase_order_item_id}><td className="px-4 py-3">{item.item_type === "product" ? "Product" : "Raw Material"}</td><td className="px-4 py-3 font-medium">{item.material_name}{item.unit_name ? <span className="ml-1 text-muted-foreground">({item.unit_name})</span> : null}</td><td className="px-4 py-3">{item.quantity}</td><td className="px-4 py-3">{money(item.rate)}</td><td className="px-4 py-3">{item.gst_percent}%</td><td className="px-4 py-3 font-semibold">{money(item.line_total)}</td></tr>)}</tbody></table></div></Card>
          <Card className="ml-auto max-w-sm space-y-2 p-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(detail.subtotal)}</span></div><div className="flex justify-between"><span>GST</span><span>{money(detail.gst_amount)}</span></div><div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Grand Total</span><span>{money(detail.total_amount)}</span></div></Card>
        </>}
      </> : <>
        <Card className="flex flex-wrap items-center justify-between gap-4 p-4 md:p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-3 text-primary"><ShoppingCart className="h-5 w-5 text-primary"/></span><div><h2 className="font-semibold">Purchase Orders</h2><p className="text-sm text-muted-foreground">Create and manage vendor orders in one place.</p></div></div><Button onClick={startOrder}><Plus className="mr-2 h-4 w-4"/>Create Purchase Order</Button></Card>
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary"/></div> : <><div className="hidden overflow-x-auto rounded-2xl border bg-card md:block"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-muted/50"><tr>{["PO Number", "Date", "Vendor", "Generated By", "Warehouse", "Expected Delivery", "Items", "Total", "Status", ""].map(title => <th key={title} className="px-4 py-3 text-left font-medium text-muted-foreground">{title}</th>)}</tr></thead><tbody className="divide-y">{orders.map(order => <tr key={order.purchase_order_id} className="hover:bg-muted/30"><td className="px-4 py-3 font-mono font-medium">{order.po_number}</td><td className="px-4 py-3">{dateLabel(order.order_date)}</td><td className="px-4 py-3">{order.vendor_name}</td><td className="px-4 py-3">{order.generated_by_name || "—"}</td><td className="px-4 py-3">{order.warehouse_name}</td><td className="px-4 py-3">{dateLabel(order.expected_delivery_date)}</td><td className="px-4 py-3">{order.item_count || 0}</td><td className="px-4 py-3 font-semibold">{money(order.total_amount)}</td><td className="px-4 py-3"><select aria-label={`Status for ${order.po_number}`} className="h-9 rounded-md border bg-background px-2" value={order.status || "Pending"} disabled={saving} onChange={e => void changeStatus(order, e.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></td><td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => navigate(`/purchase-orders/${order.purchase_order_id}`)}><Eye className="mr-1 h-4 w-4"/>View</Button></td></tr>)}{!orders.length && <tr><td colSpan={10} className="p-12 text-center text-muted-foreground">No purchase orders yet. Create one to get started.</td></tr>}</tbody></table></div><div className="space-y-3 md:hidden">{orders.map(order => <Card key={order.purchase_order_id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono font-semibold">{order.po_number}</p><p className="text-sm text-muted-foreground">{order.vendor_name}</p></div><select aria-label={`Status for ${order.po_number}`} className="h-9 rounded-md border bg-background px-2 text-xs" value={order.status || "Pending"} disabled={saving} onChange={e => void changeStatus(order, e.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></div><div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Order date: {dateLabel(order.order_date)}</span><span>Delivery: {dateLabel(order.expected_delivery_date)}</span><span>Generated by: {order.generated_by_name || "—"}</span><span>Warehouse: {order.warehouse_name}</span><span>{order.item_count || 0} items</span></div><div className="flex items-center justify-between border-t pt-3"><span className="font-semibold">{money(order.total_amount)}</span><Button size="sm" variant="outline" onClick={() => navigate(`/purchase-orders/${order.purchase_order_id}`)}><Eye className="mr-1 h-4 w-4"/>View Details</Button></div></Card>)}{!orders.length && <Card className="p-8 text-center text-sm text-muted-foreground">No purchase orders yet.</Card>}</div></>}
      </>}
    </div>
  </MainLayout>;
}
