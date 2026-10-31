import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { quotationCartService, QuotationCart, getActiveQuotationCartId } from "@/services/quotation-cart.service";
import { resumeQuotationCart } from "@/lib/quotation-cart-resume";
import { useConfirm } from "@/lib/confirm";
import { ArrowLeft, Loader2, Play, Trash2 } from "lucide-react";

const money = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function QuotationCartDetail() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { id = "" } = useParams<{ id: string }>();
  const [cart, setCart] = useState<QuotationCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadCart = async () => {
    setLoading(true);
    try {
      const result = await quotationCartService.getCart(id);
      if (result.status === "success" && result.data) setCart(result.data);
      else toast({ title: "Draft unavailable", description: result.message, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Could not load draft", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadCart(); }, [id]);

  const continueDraft = () => {
    if (!cart) return;
    const stepPath = resumeQuotationCart(cart);
    navigate(`/create-quotation/${stepPath}`);
  };

  const discard = async () => {
    if (!cart) return;
    const accepted = await confirm({ title: "Discard Draft", message: `Discard ${cart.cart_number || "this draft"}? This cannot be undone.`, confirmText: "Discard", destructive: true });
    if (!accepted) return;
    setBusy(true);
    try {
      const result = await quotationCartService.discard(cart.cart_id);
      if (result.status !== "success") throw new Error(result.message || "Could not discard draft");
      if (getActiveQuotationCartId(cart.company_id) === String(cart.cart_id)) localStorage.removeItem(`active_quotation_cart_${cart.company_id}`);
      toast({ title: "Draft discarded" });
      navigate("/quotation-cart");
    } catch (error: any) {
      toast({ title: "Could not discard draft", description: error.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <MainLayout title="Quotation Draft" subtitle="Review the saved customer quotation before continuing">
      <div className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
        <Button variant="ghost" className="gap-2" onClick={() => navigate("/quotation-cart")}><ArrowLeft className="h-4 w-4" />My Cart</Button>
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          : !cart ? <Card className="p-8 text-center"><p>Draft not found.</p></Card>
          : <>
            <Card className="p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><div className="flex items-center gap-2"><h2 className="text-xl font-semibold">{cart.client_name || "Customer"}</h2><Badge variant="outline">Draft</Badge></div><p className="mt-1 text-sm text-muted-foreground">{cart.cart_number} · {cart.package_name || "No package selected"}</p></div>
                <div className="text-left md:text-right"><p className="text-sm text-muted-foreground">Current estimate</p><p className="text-2xl font-semibold">{money(cart.final_amount)}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button className="gap-2" onClick={continueDraft}><Play className="h-4 w-4" />Continue Quotation</Button>
                <Button variant="outline" className="gap-2 text-destructive" disabled={busy} onClick={discard}><Trash2 className="h-4 w-4" />Discard Draft</Button>
              </div>
            </Card>
            {(cart.rooms || []).map((room: any) => (
              <Card key={room.qcr_id} className="p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">{room.room_name || "Room"}</h3><span className="text-sm text-muted-foreground">{money(room.room_total)}</span></div>
                <div className="space-y-2">
                  {(room.items || []).map((item: any) => <div key={item.qcp_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 p-3 text-sm"><span className="font-medium">{item.product_name || "Product"}</span><span className="text-muted-foreground">Qty {item.qty} · {money(item.total_price)}</span></div>)}
                  {!room.items?.length && <p className="text-sm text-muted-foreground">No products added yet.</p>}
                </div>
              </Card>
            ))}
          </>}
      </div>
    </MainLayout>
  );
}
