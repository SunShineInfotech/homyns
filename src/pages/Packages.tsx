import { MainLayout } from "@/components/layout/MainLayout";
import { CrudShell, newId } from "@/components/crud/CrudShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelectChips } from "@/components/ui/multi-select-chips";
import { packages, items, rawMaterials, Pkg, fmtINR, PackageItemRemark } from "@/data/mockData";

export default function Packages() {
  return (
    <MainLayout title="Packages" subtitle="Bundles of items offered to clients">
      <CrudShell<Pkg>
        entityName="Package"
        initialData={packages}
        exportFileName="packages.csv"
        searchKeys={["name", "details"]}
        emptyRow={() => ({ id: newId(), name: "", details: "", price: 0, offerPrice: 0, durationDays: 30, description: "", itemIds: [], itemRemarks: [] })}
        columns={[
          { key: "name", header: "Name", sortable: true },
          { key: "details", header: "Details" },
          { key: "duration", header: "Days", render: (r) => r.durationDays ?? "—" },
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
          const remarks = row.itemRemarks ?? [];
          const getRemark = (itemId: string): PackageItemRemark => remarks.find(x => x.itemId === itemId) ?? { itemId, remark: "", rawRemarks: {} };
          const updateItemRemark = (itemId: string, patch: Partial<PackageItemRemark>) => {
            const existing = getRemark(itemId);
            const next = { ...existing, ...patch };
            const others = remarks.filter(x => x.itemId !== itemId);
            setRow({ ...row, itemRemarks: [...others, next] });
          };
          return (
            <>
              <div><Label>Package Name</Label><Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div><Label>Details (short)</Label><Input value={row.details} onChange={(e) => setRow({ ...row, details: e.target.value })} className="h-11 rounded-xl mt-1.5" /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Base Price</Label><Input type="number" value={row.price} onChange={(e) => setRow({ ...row, price: Number(e.target.value) })} className="h-11 rounded-xl mt-1.5" /></div>
                <div><Label className="text-xs">Offer Price</Label><Input type="number" value={row.offerPrice} onChange={(e) => setRow({ ...row, offerPrice: Number(e.target.value) })} className="h-11 rounded-xl mt-1.5" /></div>
                <div><Label className="text-xs">Days</Label><Input type="number" value={row.durationDays ?? 0} onChange={(e) => setRow({ ...row, durationDays: Number(e.target.value) })} className="h-11 rounded-xl mt-1.5" /></div>
              </div>
              <div>
                <Label>Description (rich text)</Label>
                <Textarea value={row.description} onChange={(e) => setRow({ ...row, description: e.target.value })} rows={4} className="rounded-xl mt-1.5 font-mono text-xs" placeholder="Long text, supports HTML/markdown…" />
                <p className="text-[11px] text-muted-foreground mt-1">Rich-text editor with image upload available in next release.</p>
              </div>
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

              {row.itemIds.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="bg-secondary/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Item-wise Remarks & Raw Materials
                  </div>
                  <div className="divide-y divide-border">
                    {row.itemIds.map((id) => {
                      const it = items.find((i) => i.id === id);
                      if (!it) return null;
                      const r = getRemark(id);
                      return (
                        <div key={id} className="p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">{it.name}</p>
                            <span className="text-[11px] text-muted-foreground">{it.type}</span>
                          </div>
                          <Textarea
                            value={r.remark}
                            onChange={(e) => updateItemRemark(id, { remark: e.target.value })}
                            placeholder="Item remark…"
                            rows={2}
                            className="rounded-lg text-sm"
                          />
                          <div className="rounded-lg bg-secondary/40 p-2">
                            <p className="text-[11px] font-semibold uppercase text-muted-foreground mb-1.5">Raw Materials</p>
                            <table className="w-full text-xs">
                              <tbody className="divide-y divide-border">
                                {it.rawMaterialIds.map((rmId) => {
                                  const rm = rawMaterials.find((m) => m.id === rmId);
                                  if (!rm) return null;
                                  return (
                                    <tr key={rmId}>
                                      <td className="py-1.5 pr-2 font-medium whitespace-nowrap">{rm.name}</td>
                                      <td className="py-1.5 pr-2 text-muted-foreground whitespace-nowrap">{rm.brand} · {rm.size}</td>
                                      <td className="py-1.5">
                                        <Input
                                          value={r.rawRemarks[rmId] ?? ""}
                                          onChange={(e) => updateItemRemark(id, { rawRemarks: { ...r.rawRemarks, [rmId]: e.target.value } })}
                                          placeholder="Remark…"
                                          className="h-8 rounded-md text-xs"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
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
