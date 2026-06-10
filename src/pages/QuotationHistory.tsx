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

export default function QuotationHistory() {
  const navigate = useNavigate();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
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
    { key: "date", header: "Date", sortable: true },
  ];

  return (
    <MainLayout title="Quotation History" subtitle="Browse, filter and export quotations">
      <div className="space-y-5 animate-fade-in">
        <Card className="p-4 md:p-5 rounded-2xl border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Start Date</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">End Date</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Client</Label>
              <SearchableSelect options={toOptions(customers)} value={customerId} onChange={setCustomerId} placeholder="All clients" clearable />
            </div>
            <div className="flex gap-2 md:items-end">
              <Button onClick={() => {}} className="h-11 rounded-xl flex-1">Apply Filter</Button>
              <Button variant="outline" onClick={() => { setStart(""); setEnd(""); setCustomerId(""); }} className="h-11 rounded-xl">Reset</Button>
            </div>
          </div>
        </Card>

        <DataTable
          data={filtered}
          columns={columns}
          exportFileName="quotations.csv"
          searchKeys={["id", "customerName", "packageName", "status"]}
          renderMobileCard={(q) => (
            <Card className="p-4 rounded-2xl border-border" onClick={() => navigate(`/quotation/view/${q.id}`)}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{q.id}</p>
                  <p className="text-sm text-muted-foreground truncate">{q.customerName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{q.packageName} · {q.date}</p>
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
