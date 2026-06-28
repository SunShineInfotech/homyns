// src/pages/quotation/StepGenerate.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Download,
  Mail,
  MessageCircle,
  CheckCircle,
  Printer,
  Eye,
  Loader2,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { getQuotationData } from "../CreateQuotation";

export default function StepGenerate() {
  const navigate = useNavigate();
  const [quotationData, setQuotationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    // Read from localStorage — data was already saved & submitted in StepSummary
    const data = getQuotationData();
    setQuotationData(data);
    setLoading(false);
  }, []);

  const handleCopyId = async () => {
    const id = quotationData?.quotation_number || quotationData?.quotation_id;
    if (!id) return;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ title: "Copied", description: "Quotation number copied to clipboard" });
    } catch {
      toast({ title: "Error", description: "Could not copy", variant: "destructive" });
    } finally {
      setTimeout(() => setCopying(false), 1500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const {
    selectedClient,
    selectedPackage,
    quotation_number,
    quotation_id,
    grandTotal = 0,
    rooms = [],
  } = quotationData || {};

  const totalItems = rooms.reduce(
    (acc: number, room: any) =>
      acc + (room.items?.filter((i: any) => i.included).length || 0),
    0
  );

  const displayNumber =
    quotation_number ||
    (quotation_id ? `Q-${new Date().getFullYear()}-${String(quotation_id).padStart(4, "0")}` : "—");

  const formattedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      {/* Success card */}
      <Card className="p-6 md:p-8 bg-card border-border shadow-elevated text-center">
        {/* Icon */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 md:mb-6">
          <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
          Quotation Created!
        </h2>
        <p className="text-sm text-muted-foreground mb-5 md:mb-6">
          Your quotation has been saved successfully
        </p>

        {/* Details box */}
        <div className="p-4 md:p-6 rounded-xl bg-secondary/50 border border-border text-left mb-5 md:mb-6 space-y-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Quotation No.
              </p>
              <div className="flex items-center gap-1.5">
                <p className="text-base md:text-lg font-bold text-foreground">
                  {displayNumber}
                </p>
                <button
                  onClick={handleCopyId}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  title="Copy quotation number"
                >
                  {copying ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Date
              </p>
              <p className="font-medium text-foreground text-sm">{formattedDate}</p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Client + Package */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Client
              </p>
              <p className="font-medium text-foreground text-sm leading-snug">
                {selectedClient?.client_name || "—"}
              </p>
              {selectedClient?.phone1 && (
                <p className="text-xs text-muted-foreground">{selectedClient.phone1}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                Package
              </p>
              <p className="font-medium text-foreground text-sm leading-snug">
                {selectedPackage?.package_name || "Custom"}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Totals row */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {totalItems} item{totalItems !== 1 ? "s" : ""} across {rooms.length} room
              {rooms.length !== 1 ? "s" : ""}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Grand Total
              </p>
              <p className="text-xl md:text-2xl font-bold text-primary">
                ₹{Math.round(grandTotal).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/quotations")}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Quotations</span>
          </Button>
        </div>
      </Card>

      {/* Share card */}
      <Card className="p-4 md:p-6 bg-card border-border shadow-soft">
        <h3 className="font-semibold text-foreground text-center mb-4 md:mb-5">
          Share Quotation
        </h3>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Button
            variant="outline"
            className="flex-col h-auto py-4 md:py-6 gap-2 md:gap-3 hover:bg-secondary"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground">
              Download PDF
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4 md:py-6 gap-2 md:gap-3 hover:bg-secondary"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground">
              Send Email
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-4 md:py-6 gap-2 md:gap-3 hover:bg-secondary"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground">
              WhatsApp
            </span>
          </Button>
        </div>
      </Card>
    </div>
  );
}