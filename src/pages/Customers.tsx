import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customers, Customer } from "@/data/mockData";

export default function Customers() {
  return (
    <MainLayout title="Customers" subtitle="Manage your customer database">
      <CrudShell<Customer>
        entityName="Customer"
        initialData={customers}
        exportFileName="customers.csv"
        searchKeys={["name", "mobile", "email"]}
        emptyRow={() => ({ id: newId(), name: "", mobile: "", email: "", note: "" })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "mobile", header: "Mobile", sortable: true },
          { key: "email", header: "Email", sortable: true },
          { key: "note", header: "Note", render: (r) => <span className="text-muted-foreground">{r.note || "—"}</span> },
        ]}
        renderMobileCard={(r) => (
          <>
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-muted-foreground">{r.mobile}</p>
            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
          </>
        )}
        validate={(r) => !r.name.trim() ? "Name is required" : !r.mobile.trim() ? "Mobile is required" : null}
        renderForm={(row, setRow) => (
          <>
            <div><Label>Customer Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>Mobile Number</Label><Input value={row.mobile} onChange={(e) => setRow({ ...row, mobile: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>Email</Label><Input type="email" value={row.email} onChange={(e) => setRow({ ...row, email: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>Note</Label><Textarea value={row.note ?? ""} onChange={(e) => setRow({ ...row, note: e.target.value })} className="rounded-xl mt-1.5" rows={3} /></div>
          </>
        )}
      />
    </MainLayout>
  );
}
