import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VendorOption } from "@/api/operations";

export function VendorSearchSelect({ vendors, name, required, defaultValue, className }: {
  vendors: VendorOption[];
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const selected = vendors.find(v => v.id === selectedId);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(v => `${v.legal_name} ${v.vendor_code}`.toLowerCase().includes(q));
  }, [vendors, query]);

  return (
    <div className="relative">
      {/* Native, focusable-but-invisible input keeps this working inside existing FormData-based form submissions and preserves HTML5 required validation. */}
      <input type="text" name={name} value={selectedId} required={required} readOnly className="sr-only" tabIndex={-1} />
      <Popover open={open} onOpenChange={next => { setOpen(next); if (!next) setQuery(""); }}>
        <PopoverTrigger
          type="button"
          className={className ?? "flex h-10 w-full items-center justify-between rounded-lg border border-brand-border bg-white px-3 text-left text-sm outline-none transition focus:border-brand-forest focus:ring-2 focus:ring-brand-forest/10"}
        >
          <span className={selected ? "" : "text-brand-muted"}>
            {selected ? `${selected.legal_name} (${selected.vendor_code})` : "Choose vendor"}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--anchor-width) p-0">
          <div className="flex items-center gap-2 border-b border-brand-border px-3 py-2">
            <Search className="h-4 w-4 text-brand-muted" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search vendors..."
              className="w-full border-0 bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-brand-muted">No vendors match.</p>}
            {filtered.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => { setSelectedId(v.id); setOpen(false); setQuery(""); }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-brand-background ${v.id === selectedId ? "bg-brand-background font-medium text-brand-forest" : ""}`}
              >
                {v.legal_name} <span className="text-xs text-brand-muted">{v.vendor_code}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
