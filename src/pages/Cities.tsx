import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cities, states, City, toOptions } from "@/data/mockData";

export default function Cities() {
  return (
    <MainLayout title="City Master" subtitle="Manage cities">
      <CrudShell<City>
        entityName="City"
        initialData={cities}
        exportFileName="cities.csv"
        searchKeys={["name"]}
        emptyRow={() => ({ id: newId(), stateId: "", name: "" })}
        columns={[
          { key: "state", header: "State", sortable: true, accessor: (r) => states.find(s => s.id === r.stateId)?.name ?? "", render: (r) => states.find(s => s.id === r.stateId)?.name ?? "—" },
          { key: "name", header: "City Name", sortable: true },
        ]}
        renderMobileCard={(r) => (<><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{states.find(s => s.id === r.stateId)?.name}</p></>)}
        validate={(r) => !r.stateId ? "State required" : !r.name.trim() ? "Name required" : null}
        renderForm={(row, setRow) => (
          <>
            <div><Label>State</Label><div className="mt-1.5"><SearchableSelect options={toOptions(states)} value={row.stateId} onChange={(v) => setRow({ ...row, stateId: v })} /></div></div>
            <div><Label>City Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
          </>
        )}
      />
    </MainLayout>
  );
}
