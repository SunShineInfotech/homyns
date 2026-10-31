import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { API_URL } from "@/services/api.config";
import { Employee, employeeService } from "@/services/employee.service";
import {
  PRODUCTION_STATUSES,
  WORK_ORDER_PRIORITIES,
  WorkOrderHistoryEntry,
  workOrderService,
} from "@/services/workorder.service";
import { CalendarDays, ClipboardList, History, Loader2 } from "lucide-react";

interface WorkOrderManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  employeeId: string;
  quotationNumber?: string;
  rooms: any[];
  initialProduct?: any | null;
  onProductUpdated: (product: any) => void;
}

const productionStatusStyles: Record<number, string> = {
  1: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  4: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  5: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const priorityStyles: Record<number, string> = {
  1: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  3: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  4: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const getImageUrl = (imagePath?: string) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  return new URL(imagePath.replace(/^\/+/, ""), baseUrl).toString();
};

const formatHistoryDate = (entry: WorkOrderHistoryEntry) => {
  const date = entry.c_date || entry.c_datetime?.slice(0, 10);
  if (!date) return "Date unavailable";
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = entry.c_time || entry.c_datetime?.slice(11, 19);
  return `${day}${time ? ` · ${time} IST` : ""}`;
};

const formatDate = (date?: string) => {
  if (!date) return "—";
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

export function WorkOrderManager({
  open,
  onOpenChange,
  companyId,
  employeeId,
  quotationNumber,
  rooms,
  initialProduct = null,
  onProductUpdated,
}: WorkOrderManagerProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [history, setHistory] = useState<WorkOrderHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productionStatus, setProductionStatus] = useState("1");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("2");
  const [remark, setRemark] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!open || !companyId) return;
    employeeService.getEmployees(companyId).then((response) => {
      if (response.status === "success" && response.data) setEmployees(response.data);
    });
  }, [open, companyId]);

  const products = rooms.flatMap((room) =>
    (room.items || []).map((product: any) => ({ ...product, room_name: room.room_name })),
  );

  const openProductHistory = useCallback(async (product: any) => {
    if (!product.qp_id) {
      toast({ title: "Work order unavailable", description: "This product is missing its quotation product ID.", variant: "destructive" });
      return;
    }
    setActiveProduct(product);
    setProductionStatus(String(product.production_status || 1));
    setAssignedTo(product.assigned_to || "");
    setPriority(String(product.priority || 2));
    setRemark("");
    setImage(null);
    setHistory([]);
    setHistoryLoading(true);
    const response = await workOrderService.getProductHistory(companyId, String(product.qp_id));
    if (response.status === "success") setHistory(response.data || []);
    else toast({ title: "History unavailable", description: response.message, variant: "destructive" });
    setHistoryLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (!open || !initialProduct?.qp_id) return;
    if (String(activeProduct?.qp_id) === String(initialProduct.qp_id)) return;
    void openProductHistory(initialProduct);
  }, [open, initialProduct, activeProduct?.qp_id, openProductHistory]);

  const saveUpdate = async () => {
    if (!activeProduct?.qp_id) return;
    setSaving(true);
    try {
      let imageBase64: string | undefined;
      if (image) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(reader.error || new Error("Could not read image"));
          reader.readAsDataURL(image);
        });
      }

      const response = await workOrderService.updateProduct({
        company_id: companyId,
        qp_id: String(activeProduct.qp_id),
        emp_id: employeeId,
        production_status: Number(productionStatus),
        assigned_to: assignedTo,
        priority: Number(priority),
        remark: remark.trim(),
        image_base64: imageBase64,
      });
      if (response.status !== "success") {
        toast({ title: "Could not save work order", description: response.message, variant: "destructive" });
        return;
      }

      const assignedName = employees.find((employee) => employee.emp_id === assignedTo)?.name || "";
      const updatedProduct = {
        ...activeProduct,
        production_status: Number(productionStatus),
        production_status_title: PRODUCTION_STATUSES.find((item) => item.value === Number(productionStatus))?.label,
        assigned_to: assignedTo,
        assigned_name: assignedName,
        priority: Number(priority),
        priority_title: WORK_ORDER_PRIORITIES.find((item) => item.value === Number(priority))?.label,
        work_order_no: response.work_order_no || activeProduct.work_order_no,
      };
      setActiveProduct(updatedProduct);
      onProductUpdated(updatedProduct);
      setRemark("");
      setImage(null);

      const historyResponse = await workOrderService.getProductHistory(companyId, String(activeProduct.qp_id));
      if (historyResponse.status === "success") setHistory(historyResponse.data || []);
      toast({ title: "Saved", description: "Product work order and history have been updated." });
    } catch (error: any) {
      toast({ title: "Could not save work order", description: error?.message || "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open && !initialProduct} onOpenChange={(nextOpen) => { if (nextOpen) setActiveProduct(null); onOpenChange(nextOpen); }}>
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-5xl max-h-[90dvh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Work Orders</DialogTitle>
            <DialogDescription>{quotationNumber ? `Products in ${quotationNumber}` : "Product production details"}</DialogDescription>
          </DialogHeader>
          {products.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 py-2">
              {products.map((product: any, index: number) => {
                const status = Number(product.production_status || 1);
                const productPriority = Number(product.priority || 2);
                const assignee = product.assigned_name || employees.find((employee) => employee.emp_id === product.assigned_to)?.name;
                return (
                  <article key={product.qp_id || index} className="min-w-0 rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{product.room_name || "Room"}</p>
                        <h3 className="font-semibold break-words">{product.product_name || "Product"}</h3>
                      </div>
                      {product.work_order_no && <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{product.work_order_no}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`border-0 ${productionStatusStyles[status] || productionStatusStyles[1]}`}>
                        {product.production_status_title || PRODUCTION_STATUSES.find((item) => item.value === status)?.label}
                      </Badge>
                      <Badge className={`border-0 ${priorityStyles[productPriority] || priorityStyles[2]}`}>
                        {product.priority_title || WORK_ORDER_PRIORITIES.find((item) => item.value === productPriority)?.label} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Assigned to: <span className="text-foreground font-medium">{assignee || "Unassigned"}</span></p>
                    {(product.work_start_date || product.work_end_date) && (
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Start: {formatDate(product.work_start_date)}</p>
                        <p className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />End: {formatDate(product.work_end_date)}</p>
                      </div>
                    )}
                    <Button type="button" variant="outline" className="w-full rounded-lg gap-2" onClick={() => openProductHistory(product)}>
                      <History className="h-4 w-4" /> Status & history
                      <span className="ml-auto text-xs text-muted-foreground">{Number(product.work_status_history_count || 0)}</span>
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No products are available for work orders.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(activeProduct)} onOpenChange={(isOpen) => { if (!isOpen) { setActiveProduct(null); if (initialProduct) onOpenChange(false); } }}>
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Product Status & History</DialogTitle>
            <DialogDescription className="break-words">
              {activeProduct?.product_name || "Product"} · {activeProduct?.room_name || "Room"}
              {activeProduct?.work_order_no ? ` · ${activeProduct.work_order_no}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 py-2">
            <section className="min-w-0 space-y-4">
              <h3 className="text-sm font-semibold">Update production</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Production status</Label>
                  <Select value={productionStatus} onValueChange={setProductionStatus}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{PRODUCTION_STATUSES.map((item) => <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{WORK_ORDER_PRIORITIES.map((item) => <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Assign to employee</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Choose employee" /></SelectTrigger>
                    <SelectContent>{employees.filter((item) => item.emp_id).map((item) => <SelectItem key={item.emp_id} value={String(item.emp_id)}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-workorder-remark">Remark</Label>
                  <Textarea id="edit-workorder-remark" rows={3} value={remark} onChange={(event) => setRemark(event.target.value)} placeholder="Add a production update or note" className="rounded-lg resize-y" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-workorder-image">Attach image</Label>
                  <Input id="edit-workorder-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp" onChange={(event) => setImage(event.target.files?.[0] || null)} className="h-auto min-h-10 rounded-lg" />
                  {image && <p className="text-xs text-muted-foreground break-all">{image.name}</p>}
                </div>
              </div>
              <Button type="button" className="w-full rounded-lg" onClick={saveUpdate} disabled={saving || !activeProduct}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save update"}
              </Button>
            </section>

            <section className="min-w-0 space-y-3 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-5">
              <h3 className="text-sm font-semibold">Status history</h3>
              {historyLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : history.length === 0 ? (
                <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">No production updates yet.</p>
              ) : (
                <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                  {history.map((entry) => {
                    const status = Number(entry.status);
                    const title = entry.status_title || PRODUCTION_STATUSES.find((item) => item.value === status)?.label || "Production update";
                    const imageUrl = getImageUrl(entry.image);
                    return (
                      <article key={entry.history_id} className="rounded-xl border border-border p-3 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Badge className={`border-0 ${productionStatusStyles[status] || productionStatusStyles[1]}`}>{title}</Badge>
                          <span className="text-[11px] text-muted-foreground">{formatHistoryDate(entry)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.emp_name || "Team member"}</p>
                        {entry.remark && <p className="text-sm whitespace-pre-wrap break-words">{entry.remark}</p>}
                        {imageUrl && <a href={imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-border"><img src={imageUrl} alt="Product work update" loading="lazy" className="max-h-56 w-full object-cover" /></a>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
