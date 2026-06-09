import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { useConfirm } from "@/lib/confirm";
import { toast } from "@/hooks/use-toast";

export interface CrudPageProps<T extends { id: string }> {
  initialData: T[];
  columns: Column<T>[];
  searchKeys: string[];
  exportFileName: string;
  emptyRow: () => T;
  renderForm: (row: T, setRow: (r: T) => void) => ReactNode;
  validate?: (row: T) => string | null;
  /** mobile card render */
  renderMobileCard?: (row: T) => ReactNode;
  /** label for dialog */
  entityName: string;
}

export function CrudShell<T extends { id: string }>({
  initialData, columns, searchKeys, exportFileName,
  emptyRow, renderForm, validate, renderMobileCard, entityName,
}: CrudPageProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [editing, setEditing] = useState<T | null>(null);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

  const openCreate = () => { setEditing(emptyRow()); setOpen(true); };
  const openEdit = (r: T) => { setEditing({ ...r }); setOpen(true); };

  const handleSave = async () => {
    if (!editing) return;
    if (validate) {
      const err = validate(editing);
      if (err) { toast({ title: "Validation", description: err, variant: "destructive" }); return; }
    }
    const ok = await confirm({ title: "Confirm Save", message: "Save changes to this record?" });
    if (!ok) return;
    setData((prev) => {
      const exists = prev.find((x) => x.id === editing.id);
      return exists ? prev.map((x) => (x.id === editing.id ? editing : x)) : [editing, ...prev];
    });
    setOpen(false);
    toast({ title: "Saved", description: `${entityName} saved successfully.` });
  };

  const handleDelete = async (r: T) => {
    const ok = await confirm({ title: "Delete", message: "This action cannot be undone. Continue?", confirmText: "Delete", destructive: true });
    if (!ok) return;
    setData((prev) => prev.filter((x) => x.id !== r.id));
    toast({ title: "Deleted", description: `${entityName} removed.` });
  };

  const cols: Column<T>[] = [
    ...columns,
    { key: "__actions", header: "Actions", className: "w-32", render: (r) => (
      <div className="flex items-center gap-1.5">
        <Button size="icon" variant="ghost" onClick={() => openEdit(r)} className="h-8 w-8 rounded-lg"><Pencil className="w-4 h-4" /></Button>
        <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </div>
    )},
  ];

  return (
    <>
      <DataTable
        data={data}
        columns={cols}
        searchKeys={searchKeys}
        exportFileName={exportFileName}
        renderMobileCard={renderMobileCard ? (r) => (
          <Card className="p-4 rounded-2xl border-border">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">{renderMobileCard(r)}</div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(r)} className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        ) : undefined}
        actions={
          <Button onClick={openCreate} className="h-11 rounded-xl gap-2">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add {entityName}</span><span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing && data.find(x => x.id === editing.id) ? `Edit ${entityName}` : `Add ${entityName}`}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              {renderForm(editing, setEditing)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const newId = () => Math.random().toString(36).slice(2, 9);
