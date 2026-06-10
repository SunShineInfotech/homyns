import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { customers, states, cities, areas, Customer, toOptions } from "@/data/mockData";

export default function Customers() {
  return (
    <MainLayout title="Clients" subtitle="Manage your client database">
      <CrudShell<Customer>
        entityName="Client"
        initialData={customers}
        exportFileName="clients.csv"
        searchKeys={["name", "mobile", "email"]}
        emptyRow={() => ({ id: newId(), name: "", mobile: "", altPhone: "", whatsapp: "", email: "", address: "", stateId: "", cityId: "", areaId: "", note: "" })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "mobile", header: "Mobile", sortable: true },
          { key: "whatsapp", header: "WhatsApp" },
          { key: "email", header: "Email", sortable: true },
        ]}
        renderMobileCard={(r) => (
          <>
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-muted-foreground">{r.mobile}</p>
            <p className="text-xs text-muted-foreground truncate">{r.email}</p>
            {r.address && <p className="text-xs text-muted-foreground mt-1">{r.address}</p>}
          </>
        )}
        validate={(r) => !r.name.trim() ? "Name is required" : !r.mobile.trim() ? "Mobile is required" : null}
        renderForm={(row, setRow) => {
          const filteredCities = cities.filter((c) => !row.stateId || c.stateId === row.stateId);
          const filteredAreas = areas.filter((a) => !row.cityId || a.cityId === row.cityId);
          return (
            <>
              <div><Label>Client Name *</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label>Mobile Number *</Label><Input value={row.mobile} onChange={(e) => setRow({ ...row, mobile: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label>Alternate Number</Label><Input value={row.altPhone ?? ""} onChange={(e) => setRow({ ...row, altPhone: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input value={row.whatsapp ?? ""} onChange={(e) => setRow({ ...row, whatsapp: e.target.value })} className="h-11 rounded-xl mt-1.5" />
                <div className="flex gap-2 mt-2">
                  <Button type="button" size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => setRow({ ...row, whatsapp: row.mobile })}>Same as Mobile</Button>
                  {row.altPhone && <Button type="button" size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => setRow({ ...row, whatsapp: row.altPhone })}>Same as Alt</Button>}
                </div>
              </div>
              <div><Label>Email</Label><Input type="email" value={row.email} onChange={(e) => setRow({ ...row, email: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label>Address</Label><Textarea value={row.address ?? ""} onChange={(e) => setRow({ ...row, address: e.target.value })} className="rounded-xl mt-1.5" rows={2} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">State</Label><SearchableSelect options={toOptions(states)} value={row.stateId ?? ""} onChange={(v) => setRow({ ...row, stateId: v, cityId: "", areaId: "" })} placeholder="State" clearable /></div>
                <div><Label className="text-xs">City</Label><SearchableSelect options={toOptions(filteredCities)} value={row.cityId ?? ""} onChange={(v) => setRow({ ...row, cityId: v, areaId: "" })} placeholder="City" clearable /></div>
                <div><Label className="text-xs">Area</Label><SearchableSelect options={toOptions(filteredAreas)} value={row.areaId ?? ""} onChange={(v) => setRow({ ...row, areaId: v })} placeholder="Area" clearable /></div>
              </div>
              <div><Label>Note</Label><Textarea value={row.note ?? ""} onChange={(e) => setRow({ ...row, note: e.target.value })} className="rounded-xl mt-1.5" rows={2} /></div>
            </>
          );
        }}
      />
    </MainLayout>
  );
}
