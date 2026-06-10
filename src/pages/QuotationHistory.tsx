import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/data-table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { quotations, customers, fmtINR, statusColor, toOptions, QuotationRecord } from "@/data/mockData";

const minusDays = (d: number) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString().slice(0, 10); };

export default function QuotationHistory() {
  const navigate = useNavigate();
  const [start, setStart] = useState(minusDays(30));
  const [end, setEnd] = useState(minusDays(0));
  const [customerId, setCustomerId] = useState("");

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      if (start && q.date < start) return false;
      if (end && q.date > end) return false;
      if (customerId && q.customerId !== customerId) return false;
      return true;
    });
  }, [start, end, customerId]);

  const columns: Column<QuotationRecord>[] = [
    { key: "id", header: "ID", sortable: true },
    { key: "customerName", header: "Client", sortable: true },
    { key: "packageName", header: "Package", sortable: true },
    { key: "amount", header: "Amount", sortable: true, render: (r) => <span className="font-semibold">{fmtINR(r.amount)}</span>, accessor: (r) => r.amount },
    { key: "status", header: "Status", sortable: true, render: (r) => (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(r.status)}`}>{r.status}</span>
    )},
    { key: "createdBy", header: "Created By", sortable: true },
    { key: "approvedBy", header: "Approved/Rejected By", render: (r) => r.approvedBy || r.rejectedBy || "—" },
    { key: "date", header: "Date", sortable: true },
  ];

  const filters = (
    <Card className="p-3 md:p-4 rounded-2xl border-border">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 items-end">
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1 block">Start Date</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1 block">End Date</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label className="text-[11px] text-muted-foreground mb-1 block">Client</Label>
          <SearchableSelect options={toOptions(customers)} value={customerId} onChange={setCustomerId} placeholder="All clients" clearable />
        </div>
        <Button
          variant="ghost"
          className="h-10 rounded-xl text-xs text-muted-foreground col-span-2 md:col-span-1"
          onClick={() => { setStart(minusDays(30)); setEnd(minusDays(0)); setCustomerId(""); }}
        >
          Clear Filters
        </Button>
      </div>
    </Card>
  );

  return (
    <MainLayout title="Quotation History" subtitle="Browse, filter and export quotations">
      <div className="space-y-5 animate-fade-in">
        <DataTable
          data={filtered}
          columns={columns}
          exportFileName="quotations.csv"
          searchKeys={["id", "customerName", "packageName", "status"]}
          filters={filters}
          renderMobileCard={(q) => (
            <Card className="p-4 rounded-2xl border-border" onClick={() => navigate(`/quotation/view/${q.id}`)}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{q.id}</p>
                  <p className="text-sm text-muted-foreground truncate">{q.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{q.packageName} · {q.date}</p>
                  {(q.approvedBy || q.rejectedBy) && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {q.approvedBy ? `Approved by ${q.approvedBy}` : `Rejected by ${q.rejectedBy}`}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">{fmtINR(q.amount)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColor(q.status)}`}>{q.status}</span>
                </div>
              </div>
            </Card>
          )}
        />
      </div>
    </MainLayout>
  );
}
