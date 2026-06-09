import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rawMaterials, RawMaterial } from "@/data/mockData";

export default function RawMaterials() {
  return (
    <MainLayout title="Raw Materials" subtitle="Manage the materials catalog">
      <CrudShell<RawMaterial>
        entityName="Raw Material"
        initialData={rawMaterials}
        exportFileName="raw-materials.csv"
        searchKeys={["name", "code"]}
        emptyRow={() => ({ id: newId(), name: "", code: "" })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "code", header: "Code", sortable: true },
        ]}
        renderMobileCard={(r) => (<><p className="font-semibold">{r.name}</p><p className="text-sm text-muted-foreground">{r.code}</p></>)}
        validate={(r) => !r.name.trim() ? "Name required" : !r.code.trim() ? "Code required" : null}
        renderForm={(row, setRow) => (
          <>
            <div><Label>Raw Material Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>Raw Material Code</Label><Input value={row.code} onChange={(e) => setRow({ ...row, code: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
          </>
        )}
      />
    </MainLayout>
  );
}
