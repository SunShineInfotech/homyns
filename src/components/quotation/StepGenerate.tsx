import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Client, Package } from "@/data/quotationData";
import {
  FileCheck,
  Download,
  Mail,
  MessageCircle,
  CheckCircle,
  Printer,
  Eye,
} from "lucide-react";

interface StepGenerateProps {
  client: Client | null;
  selectedPackage: Package | null;
  grandTotal: number;
}

export function StepGenerate({
  client,
  selectedPackage,
  grandTotal,
}: StepGenerateProps) {
  const quotationId = `Q-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 1000)
  ).padStart(3, "0")}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success State */}
      <Card className="p-8 bg-card border-border shadow-elevated text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>

        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
          Quotation Ready!
        </h2>
        <p className="text-muted-foreground mb-6">
          Your quotation has been generated successfully
        </p>

        {/* Quotation Preview Card */}
        <div className="p-6 rounded-xl bg-secondary/50 border border-border text-left mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Quotation ID
              </p>
              <p className="text-lg font-semibold text-foreground">
                {quotationId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Date
              </p>
              <p className="font-medium text-foreground">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="h-px bg-border my-4" />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Client
              </p>
              <p className="font-medium text-foreground">{client?.name}</p>
              <p className="text-sm text-muted-foreground">{client?.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Package
              </p>
              <p className="font-medium text-foreground">
                {selectedPackage?.name}
              </p>
            </div>
          </div>

          <div className="h-px bg-border my-4" />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Grand Total</span>
            <span className="text-2xl font-bold text-primary">
              ₹{grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </Card>

      {/* Share Options */}
      <Card className="p-6 bg-card border-border shadow-soft">
        <h3 className="font-display font-semibold text-foreground text-center mb-6">
          Share Quotation
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex-col h-auto py-6 gap-3 hover:bg-secondary"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Download PDF
            </span>
          </Button>

          <Button
            variant="outline"
            className="flex-col h-auto py-6 gap-3 hover:bg-secondary"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-foreground">
              Send Email
            </span>
          </Button>

          <Button
            variant="outline"
            className="flex-col h-auto py-6 gap-3 hover:bg-secondary"
          >
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-success" />
            </div>
            <span className="text-sm font-medium text-foreground">WhatsApp</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
