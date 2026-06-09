import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Opt = { value: string; label: string };

interface Props {
  options: Opt[];
  values: string[];
  onChange: (vs: string[]) => void;
  placeholder?: string;
}

export function MultiSelectChips({ options, values, onChange, placeholder = "Select…" }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between h-11 rounded-xl font-normal bg-card">
            <span className={cn("text-left truncate", values.length === 0 && "text-muted-foreground")}>
              {values.length === 0 ? placeholder : `${values.length} selected`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start">
          <Command>
            <CommandInput placeholder="Search…" className="h-11" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)} className="cursor-pointer">
                    <Check className={cn("mr-2 h-4 w-4", values.includes(o.value) ? "opacity-100" : "opacity-0")} />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => {
            const o = options.find((x) => x.value === v);
            return (
              <Badge key={v} variant="secondary" className="rounded-lg gap-1 pr-1 py-1">
                {o?.label ?? v}
                <button onClick={() => toggle(v)} className="hover:bg-background/50 rounded p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
