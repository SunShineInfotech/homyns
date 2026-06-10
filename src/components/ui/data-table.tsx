import { ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number;
};

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchKeys?: (keyof T | string)[];
  exportFileName?: string;
  renderMobileCard?: (row: T) => ReactNode;
  actions?: ReactNode;
  emptyText?: string;
  filters?: ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data, columns, pageSize = 10, searchKeys, exportFileName = "export.csv",
  renderMobileCard, actions, emptyText = "No records found.", filters,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (query.trim()) {
      const q = query.toLowerCase();
      const keys = searchKeys ?? Object.keys(data[0] ?? {});
      rows = rows.filter((r) => keys.some((k) => String(r[k as string] ?? "").toLowerCase().includes(q)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      rows.sort((a, b) => {
        const av = col?.accessor ? col.accessor(a) : a[sort.key];
        const bv = col?.accessor ? col.accessor(b) : b[sort.key];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, query, sort, columns, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const exportCsv = () => {
    const headers = columns.map((c) => c.header);
    const rows = filtered.map((r) =>
      columns.map((c) => {
        const v = c.accessor ? c.accessor(r) : r[c.key];
        const s = v == null ? "" : String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
    );
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = exportFileName; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key: string) => {
    setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  };

  return (
    <div className="space-y-4">
      {/* Filters (mobile collapsible) */}
      {filters && (
        <>
          <div className="md:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters((s) => !s)}
              className="w-full h-10 rounded-xl"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {showFilters && <div className="mt-3">{filters}</div>}
          </div>
          <div className="hidden md:block">{filters}</div>
        </>
      )}

      {/* 80/20 search + actions row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search…"
            className="pl-10 h-11 rounded-xl bg-card"
          />
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
        <Button
          variant="outline"
          onClick={exportCsv}
          className="hidden md:inline-flex h-11 rounded-xl gap-2 shrink-0"
        >
          <Download className="w-4 h-4" /> CSV
        </Button>
      </div>

      {/* Mobile cards (no pagination) */}
      {renderMobileCard && (
        <div className="md:hidden space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">{emptyText}</p>}
          {filtered.map((r, i) => <div key={i}>{renderMobileCard(r)}</div>)}
        </div>
      )}

      {/* Desktop table */}
      <div className={cn("rounded-2xl border border-border bg-card overflow-hidden shadow-sm", renderMobileCard && "hidden md:block")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => c.sortable && toggleSort(c.key)}
                    className={cn(
                      "text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3.5",
                      c.sortable && "cursor-pointer select-none hover:text-foreground",
                      c.className
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {c.header}
                      {c.sortable && (
                        sort?.key === c.key
                          ? sort.dir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                          : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {slice.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">{emptyText}</td></tr>
              )}
              {slice.map((row, i) => (
                <tr key={i} className="hover:bg-secondary/40 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3.5 text-foreground", c.className)}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desktop pagination only */}
      {filtered.length > 0 && (
        <div className="hidden md:flex gap-3 items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>Prev</Button>
            <span className="px-3 py-1 rounded-md bg-secondary text-foreground font-medium">{safePage} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
