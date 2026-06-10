import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { items, rawMaterials, Item, ITEM_TYPES, ItemType } from "@/data/mockData";
import { MultiSelectChips } from "@/components/ui/multi-select-chips";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Items() {
  return (
    <MainLayout title="Categories (Items)" subtitle="Categories composed of raw materials">
      <CrudShell<Item>
        entityName="Category"
        initialData={items}
        exportFileName="categories.csv"
        searchKeys={["name", "type"]}
        emptyRow={() => ({ id: newId(), name: "", rawMaterialIds: [], type: "Wood" })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "type", header: "Type", sortable: true, render: (r) => <span className="px-2 py-0.5 rounded-md bg-secondary text-xs">{r.type || "—"}</span> },
          { key: "materials", header: "Raw Materials", render: (r) => (
            <span className="text-muted-foreground text-xs">{r.rawMaterialIds.map(id => rawMaterials.find(m => m.id === id)?.name).filter(Boolean).join(", ") || "—"}</span>
          )},
        ]}
        renderMobileCard={(r) => (<><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.type} · {r.rawMaterialIds.length} materials</p></>)}
        validate={(r) => !r.name.trim() ? "Name required" : null}
        renderForm={(row, setRow) => (
          <>
            <div><Label>Category Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div>
              <Label>Type</Label>
              <RadioGroup value={row.type || "Wood"} onValueChange={(v) => setRow({ ...row, type: v as ItemType })} className="grid grid-cols-4 gap-2 mt-2">
                {ITEM_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border cursor-pointer hover:bg-secondary/50 text-sm">
                    <RadioGroupItem value={t} /> {t}
                  </label>
                ))}
              </RadioGroup>
            </div>
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
