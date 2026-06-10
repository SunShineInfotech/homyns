import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { subcategories, items, Subcategory, toOptions, fmtINR } from "@/data/mockData";

export default function Subcategories() {
  return (
    <MainLayout title="Subcategories" subtitle="Subcategory items inside each category">
      <CrudShell<Subcategory>
        entityName="Subcategory"
        initialData={subcategories}
        exportFileName="subcategories.csv"
        searchKeys={["name", "materialType"]}
        emptyRow={() => ({ id: newId(), categoryId: "", name: "", defaultWidth: 0, defaultHeight: 0, defaultUnit: "NOS", defaultRate: 0, materialType: "" })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "category", header: "Category", render: (r) => items.find(i => i.id === r.categoryId)?.name || "—" },
          { key: "materialType", header: "Material" },
          { key: "size", header: "Default Size", render: (r) => `${r.defaultWidth ?? "—"} × ${r.defaultHeight ?? "—"} ${r.defaultUnit ?? ""}` },
          { key: "defaultRate", header: "Rate", sortable: true, render: (r) => fmtINR(r.defaultRate ?? 0), accessor: (r) => r.defaultRate ?? 0 },
        ]}
        renderMobileCard={(r) => (
          <>
            <p className="font-semibold">{r.name}</p>
            <p className="text-xs text-muted-foreground">{items.find(i => i.id === r.categoryId)?.name} · {r.materialType}</p>
            <p className="text-sm font-medium mt-1">{fmtINR(r.defaultRate ?? 0)}</p>
          </>
        )}
        validate={(r) => !r.name.trim() ? "Name required" : !r.categoryId ? "Category required" : null}
        renderForm={(row, setRow) => (
          <>
            <div><Label>Category</Label><div className="mt-1.5"><SearchableSelect options={toOptions(items)} value={row.categoryId} onChange={(v) => setRow({ ...row, categoryId: v })} placeholder="Choose category" /></div></div>
            <div><Label>Subcategory Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Width</Label><Input type="number" value={row.defaultWidth ?? 0} onChange={(e) => setRow({ ...row, defaultWidth: +e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label className="text-xs">Height</Label><Input type="number" value={row.defaultHeight ?? 0} onChange={(e) => setRow({ ...row, defaultHeight: +e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label className="text-xs">Unit</Label><Input value={row.defaultUnit ?? ""} onChange={(e) => setRow({ ...row, defaultUnit: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            </div>
            <div><Label>Default Rate (₹)</Label><Input type="number" value={row.defaultRate ?? 0} onChange={(e) => setRow({ ...row, defaultRate: +e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
            <div><Label>Material Type</Label><Input value={row.materialType ?? ""} onChange={(e) => setRow({ ...row, materialType: e.target.value })} className="h-11 rounded-xl mt-1.5" placeholder="e.g. MS Grill with Wood" /></div>
          </>
        )}
      />
    </MainLayout>
  );
}
