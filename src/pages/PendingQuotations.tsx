import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { quotations as initialQuotations, fmtINR, statusColor, QuotationRecord } from "@/data/mockData";
import { Check, X, Clock, User } from "lucide-react";
import { useConfirm } from "@/lib/confirm";
import { toast } from "@/hooks/use-toast";

export default function PendingQuotations() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [list, setList] = useState<QuotationRecord[]>(initialQuotations);
  const [rejectFor, setRejectFor] = useState<QuotationRecord | null>(null);
  const [reason, setReason] = useState("");
  const [rejectedTarget, setRejectedTarget] = useState<QuotationRecord | null>(null);

  const pending = list.filter((q) => q.status === "Pending");

  const approve = async (q: QuotationRecord) => {
    const ok = await confirm({ title: "Approve quotation", message: `Approve ${q.id}?` });
    if (!ok) return;
    setList((prev) => prev.map((x) => x.id === q.id ? { ...x, status: "Approved", approvedBy: "Arjun Kapoor", approvedAt: new Date().toISOString().slice(0,10) } : x));
    toast({ title: "Approved", description: `${q.id} approved.` });
  };

  const openReject = (q: QuotationRecord) => { setRejectFor(q); setReason(""); };

  const submitReject = () => {
    if (!rejectFor || !reason.trim()) { toast({ title: "Reason required", variant: "destructive" }); return; }
    setList((prev) => prev.map((x) => x.id === rejectFor.id ? { ...x, status: "Rejected", rejectedBy: "Arjun Kapoor", rejectReason: reason } : x));
    setRejectedTarget(rejectFor);
    setRejectFor(null);
  };

  const handleRegenerate = () => {
    setRejectedTarget(null);
    navigate("/create-quotation");
  };

  return (
    <MainLayout title="Pending Approvals" subtitle={`${pending.length} quotations awaiting approval`}>
      <div className="space-y-3 animate-fade-in">
        {pending.length === 0 && (
          <Card className="p-12 text-center rounded-2xl border-border">
            <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No pending quotations 🎉</p>
          </Card>
        )}

        {pending.map((q) => (
          <Card key={q.id} className="p-4 md:p-5 rounded-2xl border-border">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground">{q.id}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColor(q.status)}`}>{q.status}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{q.customerName} · {q.packageName}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                  <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> Created by {q.createdBy ?? "—"}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {q.date}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">{fmtINR(q.amount)}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => approve(q)} className="rounded-xl gap-2 h-10 bg-success hover:bg-success/90 text-success-foreground">
                  <Check className="w-4 h-4" /> Approve
                </Button>
                <Button onClick={() => openReject(q)} variant="outline" className="rounded-xl gap-2 h-10 border-destructive/40 text-destructive hover:bg-destructive/5">
                  <X className="w-4 h-4" /> Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reject reason dialog */}
      <Dialog open={!!rejectFor} onOpenChange={(v) => !v && setRejectFor(null)}>
        <DialogContent className="rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display">Reject {rejectFor?.id}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection…" rows={4} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={submitReject} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* After-reject re-generate prompt */}
      <Dialog open={!!rejectedTarget} onOpenChange={(v) => !v && setRejectedTarget(null)}>
        <DialogContent className="rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display">Quotation Rejected</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Would you like to re-generate this quotation for the same client? Existing selections will be pre-filled so the user can edit and resubmit.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectedTarget(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleRegenerate} className="rounded-xl">Re-Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
