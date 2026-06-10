import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { customerAddresses, customers, states, cities, areas, CustomerAddress, toOptions } from "@/data/mockData";

export default function CustomerAddresses() {
  return (
    <MainLayout title="Client Addresses" subtitle="Manage saved client addresses" backTo="/customers">
      <CrudShell<CustomerAddress>
        entityName="Address"
        initialData={customerAddresses}
        exportFileName="customer-addresses.csv"
        searchKeys={["address"]}
        emptyRow={() => ({ id: newId(), customerId: "", address: "", stateId: "", cityId: "", areaId: "" })}
        columns={[
          { key: "customer", header: "Client", sortable: true, accessor: (r) => customers.find(c => c.id === r.customerId)?.name ?? "", render: (r) => customers.find(c => c.id === r.customerId)?.name ?? "—" },
          { key: "address", header: "Address", sortable: true },
          { key: "area", header: "Area", render: (r) => areas.find(a => a.id === r.areaId)?.name ?? "—" },
          { key: "city", header: "City", render: (r) => cities.find(c => c.id === r.cityId)?.name ?? "—" },
          { key: "state", header: "State", render: (r) => states.find(s => s.id === r.stateId)?.name ?? "—" },
        ]}
        renderMobileCard={(r) => (
          <>
            <p className="font-semibold">{customers.find(c => c.id === r.customerId)?.name ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{r.address}</p>
            <p className="text-xs text-muted-foreground">{[areas.find(a=>a.id===r.areaId)?.name, cities.find(c=>c.id===r.cityId)?.name, states.find(s=>s.id===r.stateId)?.name].filter(Boolean).join(", ")}</p>
          </>
        )}
        renderForm={(row, setRow) => {
          const cityOpts = toOptions(cities.filter(c => !row.stateId || c.stateId === row.stateId));
          const areaOpts = toOptions(areas.filter(a => (!row.stateId || a.stateId === row.stateId) && (!row.cityId || a.cityId === row.cityId)));
          return (
            <>
              <div><Label>Client</Label><div className="mt-1.5"><SearchableSelect options={toOptions(customers)} value={row.customerId} onChange={(v) => setRow({ ...row, customerId: v })} /></div></div>
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
