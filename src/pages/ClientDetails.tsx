import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { clientDetails, states, cities, areas, ClientDetail, toOptions } from "@/data/mockData";

export default function ClientDetails() {
  return (
    <MainLayout title="Client Details" subtitle="Detailed client records & locations">
      <CrudShell<ClientDetail>
        entityName="Client"
        initialData={clientDetails}
        exportFileName="client-details.csv"
        searchKeys={["name", "phone", "email", "address"]}
        emptyRow={() => ({ id: newId(), name: "", phone: "", email: "", address: "", stateId: "", cityId: "", areaId: "" })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "phone", header: "Phone", sortable: true },
          { key: "email", header: "Email", sortable: true },
          { key: "city", header: "City", render: (r) => cities.find(c => c.id === r.cityId)?.name ?? "—" },
          { key: "state", header: "State", render: (r) => states.find(s => s.id === r.stateId)?.name ?? "—" },
        ]}
        renderMobileCard={(r) => (
          <>
            <p className="font-semibold">{r.name}</p>
            <p className="text-sm text-muted-foreground">{r.phone}</p>
            <p className="text-xs text-muted-foreground truncate">{r.address}</p>
          </>
        )}
        renderForm={(row, setRow) => {
          const cityOpts = toOptions(cities.filter(c => !row.stateId || c.stateId === row.stateId));
          const areaOpts = toOptions(areas.filter(a => (!row.stateId || a.stateId === row.stateId) && (!row.cityId || a.cityId === row.cityId)));
          return (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
                <div><Label>Phone</Label><Input value={row.phone} onChange={(e) => setRow({ ...row, phone: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={row.email} onChange={(e) => setRow({ ...row, email: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label>Address</Label><Textarea value={row.address} onChange={(e) => setRow({ ...row, address: e.target.value })} className="rounded-xl mt-1.5" rows={2} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>State</Label><div className="mt-1.5"><SearchableSelect options={toOptions(states)} value={row.stateId} onChange={(v) => setRow({ ...row, stateId: v, cityId: "", areaId: "" })} /></div></div>
                <div><Label>City</Label><div className="mt-1.5"><SearchableSelect options={cityOpts} value={row.cityId} onChange={(v) => setRow({ ...row, cityId: v, areaId: "" })} disabled={!row.stateId} /></div></div>
                <div><Label>Area</Label><div className="mt-1.5"><SearchableSelect options={areaOpts} value={row.areaId} onChange={(v) => setRow({ ...row, areaId: v })} disabled={!row.cityId} /></div></div>
              </div>
            </>
          );
        }}
      />
    </MainLayout>
  );
}
