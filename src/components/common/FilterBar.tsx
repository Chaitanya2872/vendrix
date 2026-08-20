/** The filter control for a list screen: a button, a two-level panel and the
 * chips showing what is currently applied.
 *
 * State and matching live in `hooks/useFilters`; this file renders them, and
 * exports only components so Fast Refresh keeps working.
 */
import { useRef, useState, useEffect } from "react";
import { ChevronDown, SlidersHorizontal, X, Search } from "lucide-react";
import { ALL, type Filters } from "@/hooks/useFilters";
import {
  DATE_PRESETS,
  describeDateFilter,
  isDateFilterActive,
  type DateFilterValue,
} from "@/utils/dateFilter";

export function FilterBar({ filters, className = "" }: { filters: Filters; className?: string }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
        setGroup(null);
      }
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); setGroup(null); } };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const openGroup = (key: string) => { setGroup(key); setSearch(""); };
  const activeFacet = filters.facets.find(facet => facet.key === group);
  const activeDate = filters.dates.find(facet => facet.key === group);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div ref={panelRef} className="relative">
        <button
          type="button"
          onClick={() => { setOpen(value => !value); setGroup(null); }}
          aria-expanded={open}
          className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
            open || filters.isActive
              ? "border-brand-forest bg-brand-background text-brand-forest"
              : "border-brand-border bg-white text-brand-muted hover:border-brand-gold hover:text-brand-text"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {filters.activeCount > 0 && (
            <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-brand-forest text-[10px] font-bold text-white">
              {filters.activeCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-72 overflow-hidden rounded-xl border border-brand-border bg-white shadow-lg">
            {/* Level 1 — the list of filterable things */}
            {!group && (
              <div className="p-1.5">
                {filters.facets.map(facet => (
                  <GroupRow
                    key={facet.key}
                    label={facet.label}
                    value={facet.options.find(o => o.value === filters.valueOf(facet.key))?.label}
                    onClick={() => openGroup(facet.key)}
                  />
                ))}
                {filters.dates.map(facet => (
                  <GroupRow
                    key={facet.key}
                    label={facet.label}
                    value={isDateFilterActive(filters.dateOf(facet.key)) ? describeDateFilter(filters.dateOf(facet.key)) : undefined}
                    onClick={() => openGroup(facet.key)}
                  />
                ))}
                {filters.isActive && (
                  <button
                    type="button"
                    onClick={() => { filters.clearAll(); setOpen(false); }}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Level 2 — a categorical facet's options */}
            {activeFacet && (
              <div className="p-1.5">
                <BackRow label={activeFacet.label} onClick={() => setGroup(null)} />
                {activeFacet.options.length > 6 && (
                  <div className="mx-1.5 mb-1 flex items-center gap-2 rounded-lg border border-brand-border px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-brand-muted" />
                    <input
                      autoFocus
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder={`Search ${activeFacet.label.toLowerCase()}…`}
                      className="w-full border-0 bg-transparent text-sm outline-none"
                    />
                  </div>
                )}
                <div className="max-h-64 overflow-y-auto">
                  <Choice
                    checked={filters.valueOf(activeFacet.key) === ALL}
                    label={`All ${activeFacet.label.toLowerCase()}`}
                    onSelect={() => { filters.setValue(activeFacet.key, ALL); setGroup(null); }}
                  />
                  {activeFacet.options
                    .filter(option => option.label.toLowerCase().includes(search.trim().toLowerCase()))
                    .map(option => (
                      <Choice
                        key={option.value}
                        checked={filters.valueOf(activeFacet.key) === option.value}
                        label={option.label}
                        count={option.count}
                        onSelect={() => { filters.setValue(activeFacet.key, option.value); setGroup(null); }}
                      />
                    ))}
                  {activeFacet.options.length === 0 && (
                    <p className="m-0 px-3 py-2 text-sm text-brand-muted">Nothing to filter by yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Level 2 — a date facet's presets and custom range */}
            {activeDate && (
              <div className="p-1.5">
                <BackRow label={activeDate.label} onClick={() => setGroup(null)} />
                {DATE_PRESETS.map(preset => (
                  <Choice
                    key={preset.value}
                    checked={filters.dateOf(activeDate.key).preset === preset.value}
                    label={preset.label}
                    // Choosing "custom" opens the range inputs rather than
                    // closing the panel: it is the start of picking a range,
                    // not the end of it.
                    onSelect={() => {
                      filters.setDate(activeDate.key, { ...filters.dateOf(activeDate.key), preset: preset.value });
                      if (preset.value !== "custom") setGroup(null);
                    }}
                  />
                ))}
                {filters.dateOf(activeDate.key).preset === "custom" && (
                  <CustomRange
                    value={filters.dateOf(activeDate.key)}
                    onChange={next => filters.setDate(activeDate.key, next)}
                    onApply={() => setGroup(null)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {filters.chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-background px-3 py-1.5 text-xs font-medium text-brand-forest"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => filters.clear(chip.key)}
            aria-label={`Remove filter ${chip.label}`}
            className="grid h-3.5 w-3.5 place-items-center rounded-full transition hover:bg-brand-forest/15"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

const GroupRow = ({ label, value, onClick }: { label: string; value?: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-brand-background"
  >
    <span className="text-sm font-medium text-brand-text">{label}</span>
    <span className="flex items-center gap-1.5 overflow-hidden">
      {value && <span className="max-w-[110px] truncate text-xs text-brand-forest">{value}</span>}
      <ChevronDown className="h-3.5 w-3.5 shrink-0 -rotate-90 text-brand-muted" />
    </span>
  </button>
);

const BackRow = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="mb-1 flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted transition hover:bg-brand-background"
  >
    <ChevronDown className="h-3 w-3 rotate-90" />
    {label}
  </button>
);

const Choice = ({ checked, label, count, onSelect }: {
  checked: boolean; label: string; count?: number; onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-brand-background"
  >
    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition ${checked ? "border-brand-forest bg-brand-forest" : "border-brand-border"}`}>
      {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
    <span className={`flex-1 truncate text-sm ${checked ? "font-semibold text-brand-forest" : "text-brand-text"}`}>{label}</span>
    {count != null && <span className="shrink-0 text-xs tabular-nums text-brand-muted">{count}</span>}
  </button>
);

const CustomRange = ({ value, onChange, onApply }: {
  value: DateFilterValue; onChange: (next: DateFilterValue) => void; onApply: () => void;
}) => (
  <div className="mx-1.5 mb-1 mt-1 space-y-2 rounded-lg border border-brand-border bg-brand-background/60 p-3">
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">From</span>
      <input
        type="date"
        value={value.from}
        max={value.to || undefined}
        onChange={event => onChange({ ...value, from: event.target.value })}
        className="h-9 w-full rounded-lg border border-brand-border bg-white px-2.5 text-sm outline-none focus:border-brand-forest"
      />
    </label>
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">To</span>
      <input
        type="date"
        value={value.to}
        min={value.from || undefined}
        onChange={event => onChange({ ...value, to: event.target.value })}
        className="h-9 w-full rounded-lg border border-brand-border bg-white px-2.5 text-sm outline-none focus:border-brand-forest"
      />
    </label>
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange({ ...value, from: "", to: "" })}
        className="rounded-lg px-2 py-1 text-xs font-medium text-brand-muted transition hover:bg-white hover:text-brand-text"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onApply}
        className="rounded-lg bg-brand-forest px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-forest-light"
      >
        Apply
      </button>
    </div>
    {/* Either end may be left open; only a backwards range is actually
        wrong, and saying so beats silently returning nothing. */}
    {value.from && value.to && value.from > value.to && (
      <p className="mb-0 text-xs text-red-600">The start date is after the end date.</p>
    )}
  </div>
);
