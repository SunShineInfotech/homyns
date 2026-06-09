import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { items, rawMaterials, Item } from "@/data/mockData";
import { MultiSelectChips } from "@/components/ui/multi-select-chips";

export default function Items() {
  return (
    <MainLayout title="Items" subtitle="Reusable items composed of raw materials">
      <CrudShell<Item>
        entityName="Item"
        initialData={items}
        exportFileName="items.csv"
        searchKeys={["name"]}
        emptyRow={() => ({ id: newId(), name: "", rawMaterialIds: [] })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "materials", header: "Raw Materials", render: (r) => (
            <span className="text-muted-foreground">{r.rawMaterialIds.map(id => rawMaterials.find(m => m.id === id)?.name).filter(Boolean).join(", ") || "—"}</span>
          )},
        ]}
        renderMobileCard={(r) => (<><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.rawMaterialIds.length} materials</p></>)}
        validate={(r) => !r.name.trim() ? "Name required" : null}
        renderForm={(row, setRow) => (
          <>
            <div><Label>Item Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div>
              <Label>Raw Materials</Label>
              <div className="mt-1.5">
                <MultiSelectChips
                  options={rawMaterials.map((m) => ({ value: m.id, label: m.name }))}
                  values={row.rawMaterialIds}
                  onChange={(vs) => setRow({ ...row, rawMaterialIds: vs })}
                  placeholder="Search & add materials…"
                />
              </div>
            </div>
          </>
        )}
      />
    </MainLayout>
  );
}
