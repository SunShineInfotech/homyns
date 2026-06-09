import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Mail, MessageCircle, CheckCircle2, MapPin, Phone } from "lucide-react";
import { quotations, customers, fmtINR, statusColor } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

export default function PublicQuotationView() {
  const { id } = useParams();
  const q = quotations.find((x) => x.id === id) ?? quotations[0];
  const customer = customers.find((c) => c.id === q.customerId);

  const lineItems = [
    { name: "Modular Wardrobe", qty: 2, rate: 78000 },
    { name: "TV Cabinet", qty: 1, rate: 45000 },
    { name: "King Bed with Storage", qty: 1, rate: 92000 },
    { name: "Modular Kitchen", qty: 1, rate: 285000 },
  ];
  const subtotal = lineItems.reduce((s, x) => s + x.qty * x.rate, 0);
  const tax = Math.round(subtotal * 0.18);
  const grand = subtotal + tax;

  const copy = () => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied" }); };

  return (
    <div className="min-h-screen bg-background">
      {/* Branded top */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground font-display font-bold text-lg">H</span>
            </div>
            <div>
              <p className="font-display font-semibold leading-tight">Homyns Interiors</p>
              <p className="text-[11px] text-muted-foreground">Premium Home Solutions</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(q.status)}`}>{q.status}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Hero */}
        <Card className="p-6 md:p-8 rounded-2xl border-border shadow-soft">
          <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Quotation</p>
              <h1 className="text-2xl md:text-3xl font-display font-semibold mt-1">{q.id}</h1>
              <p className="text-sm text-muted-foreground mt-1">Generated on {new Date(q.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-xs text-muted-foreground">Estimated Total</p>
              <p className="text-3xl md:text-4xl font-display font-bold text-primary">{fmtINR(grand)}</p>
              <p className="text-xs text-muted-foreground">Incl. all taxes</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <Card className="p-5 rounded-2xl border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Prepared For</p>
            <p className="font-display font-semibold text-lg">{customer?.name ?? q.customerName}</p>
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {customer?.mobile && <p className="inline-flex items-center gap-2"><Phone className="w-4 h-4" />{customer.mobile}</p>}
              {customer?.email && <p className="inline-flex items-center gap-2"><Mail className="w-4 h-4" />{customer.email}</p>}
              <p className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />Mumbai, Maharashtra</p>
            </div>
          </Card>
          <Card className="p-5 rounded-2xl border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Package</p>
            <p className="font-display font-semibold text-lg">{q.packageName}</p>
            <p className="text-sm text-muted-foreground mt-1">Complete interior solution including furniture, finishing & installation.</p>
          </Card>
        </div>

        {/* Items */}
        <Card className="rounded-2xl border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><h3 className="font-display font-semibold">Items</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3 text-center">Qty</th>
                  <th className="px-5 py-3 text-right">Rate</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lineItems.map((it, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3.5 font-medium">{it.name}</td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground">{it.qty}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{fmtINR(it.rate)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold">{fmtINR(it.qty * it.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border p-5 space-y-2 max-w-sm ml-auto text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{fmtINR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span className="font-medium">{fmtINR(tax)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border"><span className="font-display font-semibold">Grand Total</span><span className="font-display font-bold text-primary text-lg">{fmtINR(grand)}</span></div>
          </div>
        </Card>

        {/* Terms */}
        <Card className="p-5 rounded-2xl border-border">
          <h3 className="font-display font-semibold mb-3">Terms & Conditions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {["50% advance to start work, 50% before installation.","Delivery within 45 working days from confirmation.","Quotation valid for 30 days from date of issue.","All materials carry a 1-year manufacturing warranty."].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />{t}</li>
            ))}
          </ul>
        </Card>

        {/* Share */}
        <Card className="p-5 rounded-2xl border-border">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Share Quotation</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button asChild className="h-12 rounded-xl gap-2 bg-success hover:bg-success/90 text-success-foreground">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Quotation ${q.id}: ${window.location.href}`)}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl gap-2">
              <a href={`mailto:?subject=${encodeURIComponent(`Quotation ${q.id}`)}&body=${encodeURIComponent(window.location.href)}`}><Mail className="w-4 h-4" /> Email</a>
            </Button>
            <Button onClick={copy} variant="outline" className="h-12 rounded-xl gap-2"><Copy className="w-4 h-4" /> Copy Link</Button>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground pt-2 pb-6">Powered by <span className="font-semibold text-foreground">Homyns</span> · Managed by Sunshine Infotech</p>
      </main>
    </div>
  );
}
