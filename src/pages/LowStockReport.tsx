import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Package, Loader2, AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { rawMaterialService, RawMaterial } from "@/services/raw-material.service";
import { toast } from "@/hooks/use-toast";

const companyId = () => {
  try { return JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""; }
  catch { return ""; }
};

const quantity = (value: unknown) => (Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });

export default function LowStockReport() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const id = companyId();
      if (!id) {
        toast({ title: "Company not found", description: "Please log in again.", variant: "destructive" });
        setMaterials([]);
        return;
      }
      const response = await rawMaterialService.getRawMaterials(id);
      if (response.status !== "success") {
        toast({ title: "Could not load raw materials", description: response.message, variant: "destructive" });
        setMaterials([]);
        return;
      }
      setMaterials(response.data || []);
    } catch (error: any) {
      toast({ title: "Could not load raw materials", description: error?.message || "Please try again.", variant: "destructive" });
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const lowStock = useMemo(() => materials
    .filter(item => item.status !== "Inactive" && Number(item.current_stock || 0) < Number(item.min_stock_alert || 0))
    .filter(item => {
      const query = search.trim().toLowerCase();
      return !query || [item.rm_name, item.rm_type_name, item.brand_name].some(value => value?.toLowerCase().includes(query));
    })
    .sort((a, b) => Number(a.current_stock || 0) - Number(b.current_stock || 0)), [materials, search]);

  return <MainLayout title="Low Raw Material Stock" subtitle="Raw materials where current stock is below the minimum stock alert">
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-destructive/10 p-2.5 text-destructive"><AlertTriangle className="h-5 w-5"/></span>
          <div><p className="text-sm text-muted-foreground">Materials below alert level</p><p className="text-2xl font-semibold">{lowStock.length}</p></div>
        </div>
        <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search materials…" aria-label="Search low stock materials"/></div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div> : lowStock.length === 0 ? <div className="flex flex-col items-center gap-2 px-4 py-16 text-center"><Package className="h-9 w-9 text-muted-foreground/50"/><p className="font-medium">No low stock raw materials</p><p className="text-sm text-muted-foreground">Materials appear here when current stock is less than their minimum stock alert.</p></div> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Raw Material</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Brand</th><th className="px-4 py-3 text-right font-medium">Current Stock</th><th className="px-4 py-3 text-right font-medium">Min Stock Alert</th><th className="px-4 py-3 text-right font-medium">Shortage</th></tr></thead><tbody className="divide-y">{lowStock.map(item => { const current = Number(item.current_stock || 0); const alert = Number(item.min_stock_alert || 0); return <tr key={item.rm_id}><td className="px-4 py-3 font-medium">{item.rm_name}</td><td className="px-4 py-3">{item.rm_type_name || "—"}</td><td className="px-4 py-3">{item.brand_name || "—"}</td><td className="px-4 py-3 text-right"><Badge variant="destructive">{quantity(current)} {item.unit_name || ""}</Badge></td><td className="px-4 py-3 text-right">{quantity(alert)} {item.unit_name || ""}</td><td className="px-4 py-3 text-right font-semibold text-destructive">{quantity(alert - current)} {item.unit_name || ""}</td></tr>; })}</tbody></table></div>
          <div className="divide-y md:hidden">{lowStock.map(item => { const current = Number(item.current_stock || 0); const alert = Number(item.min_stock_alert || 0); return <article key={item.rm_id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.rm_name}</p><p className="mt-0.5 text-sm text-muted-foreground">{[item.rm_type_name, item.brand_name].filter(Boolean).join(" · ") || "Raw material"}</p></div><Badge variant="destructive">Low stock</Badge></div><div className="grid grid-cols-3 gap-2 text-sm"><div><p className="text-xs text-muted-foreground">Current</p><p className="font-medium">{quantity(current)} {item.unit_name || ""}</p></div><div><p className="text-xs text-muted-foreground">Alert at</p><p className="font-medium">{quantity(alert)} {item.unit_name || ""}</p></div><div><p className="text-xs text-muted-foreground">Shortage</p><p className="font-semibold text-destructive">{quantity(alert - current)} {item.unit_name || ""}</p></div></div></article>; })}</div>
        </>}
      </Card>
    </div>
  </MainLayout>;
}
