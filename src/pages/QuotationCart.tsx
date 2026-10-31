import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { quotationCartService, QuotationCart } from "@/services/quotation-cart.service";
import { resumeQuotationCart } from "@/lib/quotation-cart-resume";
import { ArrowRight, Loader2, Plus, ShoppingCart, UserRound } from "lucide-react";

const money = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const formatDate = (value?: string) => {
  if (!value) return "—";
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

export default function QuotationCartPage() {
  const navigate = useNavigate();
  const [carts, setCarts] = useState<QuotationCart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    quotationCartService.getCarts().then((result) => {
      if (result.status === "success") setCarts((result.data || []).filter((cart) => cart.status === "Draft"));
      else toast({ title: "Could not load cart", description: result.message, variant: "destructive" });
    }).catch((error: any) => toast({ title: "Could not load cart", description: error.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => carts.reduce<Record<string, { name: string; carts: QuotationCart[] }>>((groups, cart) => {
    const clientId = cart.client_id || "unknown-customer";
    const group = groups[clientId] ||= { name: cart.client_name || "Customer", carts: [] };
    group.carts.push(cart);
    return groups;
  }, {}), [carts]);

  const continueDraft = (cart: QuotationCart) => {
    const step = resumeQuotationCart(cart);
    navigate(`/create-quotation/${step}`);
  };

  return (
    <MainLayout title="My Quotation Cart" subtitle="Resume a saved quotation from the step where you left off">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Open a draft to continue at its saved step. You can go back to earlier steps any time.</p>
          <Button onClick={() => navigate("/create-quotation?new=1")} className="gap-2"><Plus className="h-4 w-4" />New Quotation</Button>
        </div>
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          : carts.length === 0 ? <Card className="p-10 text-center"><ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h2 className="font-semibold">Your cart is empty</h2><p className="mt-1 text-sm text-muted-foreground">Start a quotation and it will be saved here as you work.</p></Card>
          : Object.entries(grouped).map(([clientId, group]) => (
            <section key={clientId} className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><UserRound className="h-5 w-5 text-primary" />{group.name}<Badge variant="secondary">{group.carts.length}</Badge></h2>

              {/* Desktop quotation-list table */}
              <div className="hidden overflow-hidden rounded-2xl border md:block">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Draft #</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Package</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">Products</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Estimate</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Continue From</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Saved</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.carts.map((cart) => {
                      const productCount = (cart.rooms || []).reduce((sum, room) => sum + (room.items?.length || 0), 0);
                      return (
                        <tr key={cart.cart_id} className="transition-colors hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-medium">{cart.cart_number || `Draft #${cart.cart_id}`}</td>
                          <td className="px-4 py-3">{cart.package_name || "No package selected"}</td>
                          <td className="px-4 py-3 text-center">{productCount}</td>
                          <td className="px-4 py-3 text-right font-semibold">{money(cart.final_amount)}</td>
                          <td className="px-4 py-3"><Badge variant="outline">Items</Badge></td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(cart.updated_at || cart.c_date)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" className="gap-2" onClick={() => continueDraft(cart)}>Continue <ArrowRight className="h-4 w-4" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile quotation-list cards */}
              <div className="space-y-3 md:hidden">
                {group.carts.map((cart) => {
                  const productCount = (cart.rooms || []).reduce((sum, room) => sum + (room.items?.length || 0), 0);
                  return (
                    <Card key={cart.cart_id} className="rounded-2xl border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono font-semibold">{cart.cart_number || `Draft #${cart.cart_id}`}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">{cart.package_name || "No package selected"}</p>
                        </div>
                        <Badge variant="outline">Items</Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Products</span><p className="font-medium">{productCount}</p></div>
                        <div><span className="text-muted-foreground">Estimate</span><p className="font-semibold">{money(cart.final_amount)}</p></div>
                        <div className="col-span-2"><span className="text-muted-foreground">Saved</span><p className="font-medium">{formatDate(cart.updated_at || cart.c_date)}</p></div>
                      </div>
                      <Button className="mt-4 w-full gap-2" onClick={() => continueDraft(cart)}>Continue at Items <ArrowRight className="h-4 w-4" /></Button>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
      </div>
    </MainLayout>
  );
}
