import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { areas, states, cities, Area, toOptions } from "@/data/mockData";

export default function Areas() {
  return (
    <MainLayout title="Area Master" subtitle="Manage neighborhoods & areas">
      <CrudShell<Area>
        entityName="Area"
        initialData={areas}
        exportFileName="areas.csv"
        searchKeys={["name"]}
        emptyRow={() => ({ id: newId(), stateId: "", cityId: "", name: "" })}
        columns={[
          { key: "state", header: "State", sortable: true, accessor: (r) => states.find(s => s.id === r.stateId)?.name ?? "", render: (r) => states.find(s => s.id === r.stateId)?.name ?? "—" },
          { key: "city", header: "City", sortable: true, accessor: (r) => cities.find(c => c.id === r.cityId)?.name ?? "", render: (r) => cities.find(c => c.id === r.cityId)?.name ?? "—" },
          { key: "name", header: "Area Name", sortable: true },
        ]}
        renderMobileCard={(r) => (
          <>
            <p className="font-semibold">{r.name}</p>
            <p className="text-xs text-muted-foreground">{cities.find(c => c.id === r.cityId)?.name}, {states.find(s => s.id === r.stateId)?.name}</p>
          </>
        )}
        validate={(r) => !r.stateId ? "State required" : !r.cityId ? "City required" : !r.name.trim() ? "Name required" : null}
        renderForm={(row, setRow) => {
          const cityOpts = toOptions(cities.filter(c => !row.stateId || c.stateId === row.stateId));
          return (
            <>
              <div><Label>State</Label><div className="mt-1.5"><SearchableSelect options={toOptions(states)} value={row.stateId} onChange={(v) => setRow({ ...row, stateId: v, cityId: "" })} /></div></div>
              <div><Label>City</Label><div className="mt-1.5"><SearchableSelect options={cityOpts} value={row.cityId} onChange={(v) => setRow({ ...row, cityId: v })} disabled={!row.stateId} /></div></div>
              <div><Label>Area Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            </>
          );
        }}
      />
    </MainLayout>
  );
}
