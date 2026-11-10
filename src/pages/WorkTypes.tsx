import { FormEvent, useCallback, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useConfirm } from "@/lib/confirm";
import { WorkType, workTypeService } from "@/services/work-type.service";
import { ChevronDown, ChevronUp, ChevronsUpDown, Loader2, Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";

const getCompanyId = () => { try { return JSON.parse(localStorage.getItem("company_data") || "{}").company_id || ""; } catch { return ""; } };

export default function WorkTypes() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkType | null>(null);
  const [name, setName] = useState("");
  const [sortKey, setSortKey] = useState<"work_type_id" | "name">("work_type_id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const load = useCallback(async () => {
    setLoading(true);
    try { const result = await workTypeService.list(getCompanyId()); if (result.status === "success") setRows(result.data || []); else toast({ title: "Could not load work types", description: result.message, variant: "destructive" }); }
    catch (error: any) { toast({ title: "Could not load work types", description: error.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const startAdd = () => { setEditing(null); setName(""); setOpen(true); };
  const startEdit = (row: WorkType) => { setEditing(row); setName(row.name); setOpen(true); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!name.trim()) return;
    setSaving(true);
    try { const result = await workTypeService.save(getCompanyId(), name.trim(), editing?.work_type_id); if (result.status === "success") { toast({ title: editing ? "Work type updated" : "Work type added" }); setOpen(false); await load(); } else toast({ title: "Could not save work type", description: result.message, variant: "destructive" }); }
    catch (error: any) { toast({ title: "Could not save work type", description: error.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };
  const remove = async (row: WorkType) => {
    const accepted = await confirm({ title: "Delete Agency Work Type", message: `Delete “${row.name}”? Agencies using it will no longer have this assignment.`, confirmText: "Delete", destructive: true });
    if (!accepted) return;
    try { const result = await workTypeService.remove(getCompanyId(), row.work_type_id); if (result.status === "success") { toast({ title: "Work type deleted" }); await load(); } else toast({ title: "Could not delete work type", description: result.message, variant: "destructive" }); }
    catch (error: any) { toast({ title: "Could not delete work type", description: error.message, variant: "destructive" }); }
  };
  const shown = rows.filter(row => row.name.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => {
    const compare = sortKey === "name"
      ? a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true })
      : Number(a.work_type_id) - Number(b.work_type_id);
    return sortDir === "asc" ? compare : -compare;
  });
  const toggleSort = (key: "work_type_id" | "name") => {
    if (sortKey === key) setSortDir(current => current === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const SortIcon = ({ column }: { column: "work_type_id" | "name" }) => sortKey !== column
    ? <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
    : sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;
  return <MainLayout title="Agency Work Types" subtitle="Manage the work categories available for agencies.">
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="relative min-w-[220px] flex-1 sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" placeholder="Search agency work types" value={search} onChange={event => setSearch(event.target.value)}/></div><Button onClick={startAdd}><Plus className="mr-2 h-4 w-4"/>Agency Work Types</Button></div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="bg-muted/50"><tr>
        <th aria-sort={sortKey === "work_type_id" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="w-24 px-4 py-3 text-left font-medium text-muted-foreground"><button type="button" onClick={() => toggleSort("work_type_id")} className="inline-flex items-center gap-1.5 hover:text-foreground">ID <SortIcon column="work_type_id" /></button></th>
        <th aria-sort={sortKey === "name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 text-left font-medium text-muted-foreground"><button type="button" onClick={() => toggleSort("name")} className="inline-flex items-center gap-1.5 hover:text-foreground">Agency Work Types <SortIcon column="name" /></button></th>
        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th></tr></thead><tbody className="divide-y">{shown.map(row=><tr key={row.work_type_id}><td className="px-4 py-3 font-mono text-muted-foreground">{row.work_type_id}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground"/>{row.name}</span></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={()=>startEdit(row)} aria-label={`Edit ${row.name}`}><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={()=>void remove(row)} aria-label={`Delete ${row.name}`}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></td></tr>)}{!loading&&!shown.length&&<tr><td colSpan={3} className="p-10 text-center text-muted-foreground">No agency work types found.</td></tr>}</tbody></table></div>{loading&&<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}</Card>
    </div>
    <Dialog open={open} onOpenChange={value=>!saving&&setOpen(value)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editing?"Edit Agency Work Type":"Add Agency Work Type"}</DialogTitle><DialogDescription>Enter a name such as Color Work, Civil Work, or Plumbing.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-1.5"><Label htmlFor="work-type-name">Agency Work Types *</Label><Input id="work-type-name" autoFocus maxLength={120} value={name} onChange={event=>setName(event.target.value)} required placeholder="e.g. Plumbing"/></div><DialogFooter><Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving||!name.trim()}>{saving?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Saving…</>:editing?"Update":"Save"}</Button></DialogFooter></form></DialogContent></Dialog>
  </MainLayout>;
}
