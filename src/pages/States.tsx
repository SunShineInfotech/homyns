import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { states, State } from "@/data/mockData";

export default function States() {
  return (
    <MainLayout title="State Master" subtitle="Manage states">
      <CrudShell<State>
        entityName="State"
        initialData={states}
        exportFileName="states.csv"
        searchKeys={["name"]}
        emptyRow={() => ({ id: newId(), name: "" })}
        columns={[{ key: "name", header: "State Name", sortable: true }]}
        renderMobileCard={(r) => <p className="font-semibold">{r.name}</p>}
        validate={(r) => !r.name.trim() ? "Name required" : null}
        renderForm={(row, setRow) => (
          <div><Label>State Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
        )}
      />
    </MainLayout>
  );
}
