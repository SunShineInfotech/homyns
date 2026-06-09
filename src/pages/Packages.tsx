import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectChips } from "@/components/ui/multi-select-chips";
import { packages, items, rawMaterials, Pkg, fmtINR } from "@/data/mockData";

export default function Packages() {
  return (
    <MainLayout title="Packages" subtitle="Bundles of items offered to customers">
      <CrudShell<Pkg>
        entityName="Package"
        initialData={packages}
        exportFileName="packages.csv"
        searchKeys={["name", "details"]}
        emptyRow={() => ({ id: newId(), name: "", details: "", price: 0, offerPrice: 0, description: "", itemIds: [] })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "details", header: "Details" },
          { key: "price", header: "Price", sortable: true, accessor: (r) => r.price, render: (r) => <span className="line-through text-muted-foreground">{fmtINR(r.price)}</span> },
          { key: "offerPrice", header: "Offer", sortable: true, accessor: (r) => r.offerPrice, render: (r) => <span className="font-semibold text-success">{fmtINR(r.offerPrice)}</span> },
          { key: "itemCount", header: "Items", render: (r) => r.itemIds.length },
        ]}
        renderMobileCard={(r) => (
          <>
            <p className="font-semibold">{r.name}</p>
            <p className="text-xs text-muted-foreground">{r.details}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-bold text-success">{fmtINR(r.offerPrice)}</span>
              <span className="text-xs line-through text-muted-foreground">{fmtINR(r.price)}</span>
            </div>
          </>
        )}
        validate={(r) => !r.name.trim() ? "Name required" : null}
        renderForm={(row, setRow) => {
          const usedRawIds = Array.from(new Set(row.itemIds.flatMap(id => items.find(i => i.id === id)?.rawMaterialIds ?? [])));
          return (
            <>
              <div><Label>Package Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label>Details</Label><Input value={row.details} onChange={(e) => setRow({ ...row, details: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price</Label><Input type="number" value={row.price} onChange={(e) => setRow({ ...row, price: Number(e.target.value) })} className="h-11 rounded-xl mt-1.5" /></div>
                <div><Label>Offer Price</Label><Input type="number" value={row.offerPrice} onChange={(e) => setRow({ ...row, offerPrice: Number(e.target.value) })} className="h-11 rounded-xl mt-1.5" /></div>
              </div>
              <div><Label>Description</Label><Textarea value={row.description} onChange={(e) => setRow({ ...row, description: e.target.value })} rows={2} className="rounded-xl mt-1.5" /></div>
              <div>
                <Label>Items in Package</Label>
                <div className="mt-1.5">
                  <MultiSelectChips
                    options={items.map((i) => ({ value: i.id, label: i.name }))}
                    values={row.itemIds}
                    onChange={(vs) => setRow({ ...row, itemIds: vs })}
                    placeholder="Add items…"
                  />
                </div>
              </div>
              {usedRawIds.length > 0 && (
                <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Raw Materials Used</p>
                  <div className="flex flex-wrap gap-1.5">
                    {usedRawIds.map((id) => (
                      <span key={id} className="px-2 py-0.5 rounded-md bg-card border border-border text-xs">
                        {rawMaterials.find((m) => m.id === id)?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        }}
      />
    </MainLayout>
  );
}
