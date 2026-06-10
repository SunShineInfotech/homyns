import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Client, Package, Room } from "@/data/quotationData";
import { User, Package as PackageIcon, MapPin, Phone, Mail } from "lucide-react";

interface StepSummaryProps {
  client: Client | null;
  selectedPackage: Package | null;
  rooms: Room[];
  subtotal: number;
  discountType: "rs" | "pct";
  setDiscountType: (v: "rs" | "pct") => void;
  discountValue: number;
  setDiscountValue: (v: number) => void;
  withGst: boolean;
  setWithGst: (v: boolean) => void;
  specialInstructions: string;
  setSpecialInstructions: (v: string) => void;
  discountAmount: number;
  tax: number;
  grandTotal: number;
}

export function StepSummary({
  client, selectedPackage, rooms, subtotal,
  discountType, setDiscountType, discountValue, setDiscountValue,
  withGst, setWithGst, specialInstructions, setSpecialInstructions,
  discountAmount, tax, grandTotal,
}: StepSummaryProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>
              <h3 className="font-display font-semibold text-foreground">Client Details</h3>
            </div>
            {client && (
              <div className="space-y-2.5">
                <p className="font-semibold text-foreground text-lg">{client.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" />{client.phone}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" />{client.email}</div>
                {client.address && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4" />{client.address}</div>}
              </div>
            )}
          </Card>

          <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center"><PackageIcon className="w-5 h-5 text-gold" /></div>
              <h3 className="font-display font-semibold text-foreground">Selected Package</h3>
            </div>
            {selectedPackage && (
              <div>
                <p className="font-semibold text-foreground text-lg mb-1">{selectedPackage.name} Package</p>
                <p className="text-sm text-muted-foreground mb-3">{selectedPackage.description}</p>
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
          <h3 className="font-display font-semibold text-foreground mb-4">Room-wise Cost Breakdown</h3>
          <div className="space-y-4">
            {rooms.map((room) => {
              const roomTotal = room.items.filter((i) => i.included).reduce((s, i) => s + i.price * i.quantity, 0);
              const included = room.items.filter((i) => i.included);
              if (included.length === 0) return null;
              return (
                <div key={room.id} className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{room.name}</h4>
                    <span className="font-semibold text-foreground">₹{roomTotal.toLocaleString()}</span>
                  </div>
                  <div className="space-y-2">
                    {included.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                        <span className="text-foreground">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 bg-card border-border shadow-soft rounded-2xl">
          <h3 className="font-display font-semibold text-foreground mb-3">Special Instructions</h3>
          <Textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Any specific notes for this quotation (delivery, finishes, exclusions, etc.)"
            rows={4}
            className="rounded-xl"
          />
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-6 bg-card border-border shadow-elevated sticky top-24 rounded-2xl space-y-5">
          <h3 className="font-display font-semibold text-foreground text-lg">Quotation Summary</h3>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Discount</Label>
            <div className="flex gap-2">
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button onClick={() => setDiscountType("rs")} className={`px-3 text-sm font-medium ${discountType==="rs"?"bg-primary text-primary-foreground":"bg-card text-muted-foreground"}`}>₹</button>
                <button onClick={() => setDiscountType("pct")} className={`px-3 text-sm font-medium ${discountType==="pct"?"bg-primary text-primary-foreground":"bg-card text-muted-foreground"}`}>%</button>
              </div>
              <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="h-10 rounded-xl flex-1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">GST</Label>
            <RadioGroup value={withGst ? "yes" : "no"} onValueChange={(v) => setWithGst(v === "yes")} className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border cursor-pointer text-sm">
                <RadioGroupItem value="yes" /> With GST (18%)
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border cursor-pointer text-sm">
                <RadioGroupItem value="no" /> Without GST
              </label>
            </RadioGroup>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="font-medium text-destructive">- ₹{discountAmount.toLocaleString()}</span></div>
            {withGst && <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (18%)</span><span className="font-medium">₹{tax.toLocaleString()}</span></div>}
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Final Total</span>
              <span className="text-2xl font-bold text-primary">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">Valid for 30 days from generation.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
