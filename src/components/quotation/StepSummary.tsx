import { Card } from "@/components/ui/card";
import { Client, Package, Room } from "@/data/quotationData";
import { User, Package as PackageIcon, MapPin, Phone, Mail } from "lucide-react";

interface StepSummaryProps {
  client: Client | null;
  selectedPackage: Package | null;
  rooms: Room[];
  subtotal: number;
  tax: number;
  grandTotal: number;
}

export function StepSummary({
  client,
  selectedPackage,
  rooms,
  subtotal,
  tax,
  grandTotal,
}: StepSummaryProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Client & Package Info */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Client Card */}
          <Card className="p-5 bg-card border-border shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground">
                Client Details
              </h3>
            </div>

            {client && (
              <div className="space-y-2.5">
                <p className="font-semibold text-foreground text-lg">
                  {client.name}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </div>
                {client.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {client.address}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Package Card */}
          <Card className="p-5 bg-card border-border shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                <PackageIcon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display font-semibold text-foreground">
                Selected Package
              </h3>
            </div>

            {selectedPackage && (
              <div>
                <p className="font-semibold text-foreground text-lg mb-1">
                  {selectedPackage.name} Package
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedPackage.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.features.slice(0, 3).map((feature, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-md bg-secondary text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Room-wise Breakdown */}
        <Card className="p-5 bg-card border-border shadow-soft">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Room-wise Cost Breakdown
          </h3>

          <div className="space-y-4">
            {rooms.map((room) => {
              const roomTotal = room.items
                .filter((i) => i.included)
                .reduce((sum, i) => sum + i.price * i.quantity, 0);
              const includedItems = room.items.filter((i) => i.included);

              if (includedItems.length === 0) return null;

              return (
                <div
                  key={room.id}
                  className="p-4 rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{room.name}</h4>
                    <span className="font-semibold text-foreground">
                      ₹{roomTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {includedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="text-foreground">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Summary Panel */}
      <div className="lg:col-span-1">
        <Card className="p-6 bg-card border-border shadow-elevated sticky top-24">
          <h3 className="font-display font-semibold text-foreground text-lg mb-6">
            Quotation Summary
          </h3>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                ₹{subtotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-medium text-foreground">
                ₹{tax.toLocaleString()}
              </span>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">
                Grand Total
              </span>
              <span className="text-2xl font-bold text-primary">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Note:</span> This
              quotation is valid for 30 days from the date of generation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
